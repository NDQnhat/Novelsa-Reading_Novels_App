/**
 * IndexedDB Service cho Novelsa
 * Quản lý offline data: novels, chapters, read position, images
 */

export interface StoredNovel {
  id: string;
  title: string;
  description: string;
  author: string;
  coverImage?: string; // base64 hoặc blob reference
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  genre: string;
  viewCount: number;
  rating: number;
  totalChapters: number;
  lastReadChapter?: number;
  readProgress?: number; // 0-100
  savedAt: number; // timestamp
  fromCache: boolean;
}

export interface StoredChapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string; // raw HTML
  compressed?: boolean; // if gzipped
  savedAt: number;
  fromCache: boolean;
}

export interface LastReadPosition {
  novelId: string;
  chapterId: string;
  chapterNumber: number;
  scrollPosition: number;
  readAt: number;
}

export interface OfflineImage {
  url: string;
  novelId: string;
  data: string; // base64
  size: number;
  cachedAt: number;
}

const DB_NAME = 'novelReaderDB';
const DB_VERSION = 2;

const STORES = {
  NOVELS: 'novels',
  CHAPTERS: 'chapters',
  READ_POSITIONS: 'lastReadPositions',
  IMAGES: 'offlineImages',
  SYNC_QUEUE: 'syncQueue', // para sa background sync
} as const;

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IDB] Open failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IDB] Connected');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[IDB] Schema upgrade to v' + db.version);

        // Novels store
        if (!db.objectStoreNames.contains(STORES.NOVELS)) {
          const novelStore = db.createObjectStore(STORES.NOVELS, {
            keyPath: 'id',
          });
          novelStore.createIndex('author', 'author', { unique: false });
          novelStore.createIndex('genre', 'genre', { unique: false });
          novelStore.createIndex('savedAt', 'savedAt', { unique: false });
        }

        // Chapters store (compound key: novelId + chapterNumber)
        if (!db.objectStoreNames.contains(STORES.CHAPTERS)) {
          const chapterStore = db.createObjectStore(
            STORES.CHAPTERS,
            { keyPath: ['novelId', 'chapterNumber'] }
          );
          chapterStore.createIndex('novelId', 'novelId', { unique: false });
          chapterStore.createIndex('savedAt', 'savedAt', { unique: false });
        }

        // Last read positions
        if (!db.objectStoreNames.contains(STORES.READ_POSITIONS)) {
          const posStore = db.createObjectStore(
            STORES.READ_POSITIONS,
            { keyPath: 'novelId' }
          );
          posStore.createIndex('readAt', 'readAt', { unique: false });
        }

        // Offline images
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          const imgStore = db.createObjectStore(STORES.IMAGES, {
            keyPath: 'url',
          });
          imgStore.createIndex('novelId', 'novelId', { unique: false });
          imgStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Sync queue for background operations
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * ============ NOVELS ============
   */

  async saveNovel(novel: StoredNovel): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.NOVELS], 'readwrite');
      const store = tx.objectStore(STORES.NOVELS);
      const request = store.put({
        ...novel,
        savedAt: Date.now(),
        fromCache: true,
      });

      request.onsuccess = () => {
        console.log('[IDB] Novel saved:', novel.id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getNovel(novelId: string): Promise<StoredNovel | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.NOVELS], 'readonly');
      const store = tx.objectStore(STORES.NOVELS);
      const request = store.get(novelId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllNovels(): Promise<StoredNovel[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.NOVELS], 'readonly');
      const store = tx.objectStore(STORES.NOVELS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNovel(novelId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [STORES.NOVELS, STORES.CHAPTERS, STORES.IMAGES],
        'readwrite'
      );

      // Delete novel
      tx.objectStore(STORES.NOVELS).delete(novelId);

      // Delete chapters
      const chapterStore = tx.objectStore(STORES.CHAPTERS);
      const chapterIndex = chapterStore.index('novelId');
      const chaptersToDelete = chapterIndex.getAll(novelId);
      chaptersToDelete.onsuccess = () => {
        chaptersToDelete.result.forEach((chapter) => {
          chapterStore.delete([novelId, chapter.chapterNumber]);
        });
      };

      // Delete images
      const imgStore = tx.objectStore(STORES.IMAGES);
      const imgIndex = imgStore.index('novelId');
      const imagesToDelete = imgIndex.getAll(novelId);
      imagesToDelete.onsuccess = () => {
        imagesToDelete.result.forEach((img) => {
          imgStore.delete(img.url);
        });
      };

      tx.oncomplete = () => {
        console.log('[IDB] Novel deleted:', novelId);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async searchNovels(
    author?: string,
    genre?: string
  ): Promise<StoredNovel[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.NOVELS], 'readonly');
      const store = tx.objectStore(STORES.NOVELS);

      let query: IDBValidKey | IDBKeyRange = '';

      if (author) {
        const index = store.index('author');
        query = author;
        const request = index.getAll(query);
        request.onsuccess = () => {
          let results = request.result;
          if (genre) {
            results = results.filter((n) => n.genre === genre);
          }
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      } else if (genre) {
        const index = store.index('genre');
        const request = index.getAll(genre);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  /**
   * ============ CHAPTERS ============
   */

  async saveChapter(chapter: StoredChapter): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CHAPTERS], 'readwrite');
      const store = tx.objectStore(STORES.CHAPTERS);
      const request = store.put({
        ...chapter,
        savedAt: Date.now(),
        fromCache: true,
      });

      request.onsuccess = () => {
        console.log('[IDB] Chapter saved:', chapter.novelId, chapter.chapterNumber);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveChapters(chapters: StoredChapter[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CHAPTERS], 'readwrite');
      const store = tx.objectStore(STORES.CHAPTERS);

      chapters.forEach((chapter) => {
        store.put({
          ...chapter,
          savedAt: Date.now(),
          fromCache: true,
        });
      });

      tx.oncomplete = () => {
        console.log('[IDB] Saved', chapters.length, 'chapters');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async getChapter(
    novelId: string,
    chapterNumber: number
  ): Promise<StoredChapter | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CHAPTERS], 'readonly');
      const store = tx.objectStore(STORES.CHAPTERS);
      const request = store.get([novelId, chapterNumber]);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getChaptersByNovel(novelId: string): Promise<StoredChapter[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CHAPTERS], 'readonly');
      const store = tx.objectStore(STORES.CHAPTERS);
      const index = store.index('novelId');
      const request = index.getAll(novelId);

      request.onsuccess = () => {
        // Sort by chapter number
        const chapters = request.result.sort(
          (a, b) => a.chapterNumber - b.chapterNumber
        );
        resolve(chapters);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChaptersForNovel(novelId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CHAPTERS], 'readwrite');
      const store = tx.objectStore(STORES.CHAPTERS);
      const index = store.index('novelId');
      const range = IDBKeyRange.only(novelId);

      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        console.log('[IDB] Chapters deleted for novel:', novelId);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * ============ READ POSITIONS ============
   */

  async saveReadPosition(position: LastReadPosition): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.READ_POSITIONS], 'readwrite');
      const store = tx.objectStore(STORES.READ_POSITIONS);
      const request = store.put({
        ...position,
        readAt: Date.now(),
      });

      request.onsuccess = () => {
        console.log('[IDB] Read position saved:', position.novelId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getReadPosition(novelId: string): Promise<LastReadPosition | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.READ_POSITIONS], 'readonly');
      const store = tx.objectStore(STORES.READ_POSITIONS);
      const request = store.get(novelId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ============ IMAGES ============
   */

  async cacheImage(
    url: string,
    novelId: string,
    imageData: string
  ): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.IMAGES], 'readwrite');
      const store = tx.objectStore(STORES.IMAGES);
      const request = store.put({
        url,
        novelId,
        data: imageData,
        size: new Blob([imageData]).size,
        cachedAt: Date.now(),
      });

      request.onsuccess = () => {
        console.log('[IDB] Image cached:', url);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedImage(url: string): Promise<string | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.IMAGES], 'readonly');
      const store = tx.objectStore(STORES.IMAGES);
      const request = store.get(url);

      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(request.error);
    });
  }

  async getImagesForNovel(novelId: string): Promise<OfflineImage[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.IMAGES], 'readonly');
      const store = tx.objectStore(STORES.IMAGES);
      const index = store.index('novelId');
      const request = index.getAll(novelId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ============ SYNC QUEUE ============
   * Para sa background sync operations
   */

  async queueSync(operation: {
    type: 'update' | 'delete' | 'download';
    novelId: string;
    data?: unknown;
  }): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.add({
        ...operation,
        queuedAt: Date.now(),
        status: 'pending',
      });

      request.onsuccess = () => {
        console.log('[IDB] Sync queued:', operation.type, operation.novelId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () =>
        resolve(
          request.result.filter((item) => item.status === 'pending')
        );
      request.onerror = () => reject(request.error);
    });
  }

  async markSyncComplete(id: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = 'complete';
          item.completedAt = Date.now();
          store.put(item);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * ============ STORAGE MANAGEMENT ============
   */

  async getStorageInfo() {
    try {
      // Estimate storage usage
      const estimate = await navigator.storage.estimate();
      const novels = await this.getAllNovels();
      const allChapters = await Promise.all(
        novels.map((n) => this.getChaptersByNovel(n.id))
      );

      const totalChapters = allChapters.flat().length;

      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentUsed: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
        novelsCount: novels.length,
        chaptersCount: totalChapters,
      };
    } catch (err) {
      console.error('[IDB] Storage estimate failed:', err);
      return null;
    }
  }

  async cleanupOldData(daysOld: number = 30): Promise<number> {
    const db = await this.init();
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [STORES.NOVELS, STORES.CHAPTERS],
        'readwrite'
      );

      // Delete old novels
      const novelStore = tx.objectStore(STORES.NOVELS);
      const novelIndex = novelStore.index('savedAt');
      const novelRange = IDBKeyRange.upperBound(cutoffTime);
      const novelCursor = novelIndex.openCursor(novelRange);

      novelCursor.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        console.log('[IDB] Cleaned up', deletedCount, 'old novels');
        resolve(deletedCount);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * ============ UTILITIES ============
   */

  async clearAll(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        Object.values(STORES),
        'readwrite'
      );

      Object.values(STORES).forEach((storeName) => {
        tx.objectStore(storeName).clear();
      });

      tx.oncomplete = () => {
        console.log('[IDB] All data cleared');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Singleton instance
export const indexedDB = new IndexedDBService();
