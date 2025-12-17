/**
 * DownloadNovelModal Component
 * Tải truyện + chapters để đọc offline
 */

import React, { useState } from 'react';
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from 'antd';
import { indexedDB, type StoredNovel, type StoredChapter } from '../services/indexedDBService';
import { novelAPI, chapterAPI } from '../services/api';

interface DownloadNovelModalProps {
  novelId: string;
  novelTitle: string;
  totalChapters: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type DownloadStatus = 'idle' | 'checking' | 'downloading' | 'complete' | 'error';

export default function DownloadNovelModal({
  novelId,
  novelTitle,
  totalChapters,
  onClose,
  onSuccess,
}: DownloadNovelModalProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [downloadedChapters, setDownloadedChapters] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Check if already downloaded
  React.useEffect(() => {
    checkIfDownloaded();
  }, [novelId]);

  const checkIfDownloaded = async () => {
    try {
      setStatus('checking');
      const novel = await indexedDB.getNovel(novelId);
      setIsDownloaded(!!novel);
      setStatus('idle');
    } catch (err) {
      console.error('[Download] Check failed:', err);
      setStatus('idle');
    }
  };

  const handleDownload = async () => {
    try {
      setStatus('downloading');
      setError(null);
      setDownloadedChapters(0);

      // Fetch novel details
      console.log('[Download] Fetching novel details...');
      const novelData = await novelAPI.getNovelById(novelId);
      if (!novelData) throw new Error('Không tìm thấy truyện');

      // Save novel to IndexedDB
      const storedNovel: StoredNovel = {
        id: novelData.id,
        title: novelData.title,
        description: novelData.description,
        author: novelData.author?.name || 'Unknown',
        coverImage: novelData.coverUrl,
        status: novelData.status,
        genre: novelData.genre || 'Khác',
        viewCount: novelData.viewCount || 0,
        rating: novelData.rating || 0,
        totalChapters: novelData.chapters?.length || 0,
        readProgress: 0,
        savedAt: Date.now(),
        fromCache: true,
      };

      await indexedDB.saveNovel(storedNovel);
      console.log('[Download] Novel saved');

      // Fetch and save chapters
      if (novelData.chapters && novelData.chapters.length > 0) {
        const chaptersToSave: StoredChapter[] = [];

        for (const chapter of novelData.chapters) {
          try {
            // Fetch chapter content
            const chapterData = await chapterAPI.getChapter(
              novelId,
              chapter.id
            );

            chaptersToSave.push({
              id: chapter.id,
              novelId: novelId,
              chapterNumber: chapter.chapterNumber,
              title: chapter.title,
              content: chapterData?.content || '',
              savedAt: Date.now(),
              fromCache: true,
            });

            setDownloadedChapters((prev) => prev + 1);
          } catch (err) {
            console.warn(
              `[Download] Failed to fetch chapter ${chapter.chapterNumber}:`,
              err
            );
          }
        }

        // Save all chapters in batch
        if (chaptersToSave.length > 0) {
          await indexedDB.saveChapters(chaptersToSave);
          console.log('[Download] Chapters saved:', chaptersToSave.length);
        }
      }

      setStatus('complete');
      setIsDownloaded(true);

      // Auto close after 2 seconds
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('[Download] Error:', err);
      setStatus('error');
      setError(
        err instanceof Error ? err.message : 'Lỗi khi tải truyện'
      );
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xoá truyện này khỏi offline?')) return;

    try {
      await indexedDB.deleteNovel(novelId);
      setIsDownloaded(false);
      setDownloadedChapters(0);
    } catch (err) {
      console.error('[Download] Delete failed:', err);
      alert('Lỗi khi xoá');
    }
  };

  return (
    <Modal
      title="Tải offline"
      open={true}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
      className="offline-download-modal"
    >
      <div className="space-y-4">
        {/* Novel title */}
        <div>
          <p className="text-sm font-semibold text-slate-200 truncate">
            {novelTitle}
          </p>
          <p className="text-xs text-slate-400">Tổng {totalChapters} chương</p>
        </div>

        {/* Status display */}
        {isDownloaded && status === 'idle' && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={18} />
              <p className="text-sm text-green-300">
                Truyện đã lưu offline ({downloadedChapters} chương)
              </p>
            </div>
          </div>
        )}

        {status === 'downloading' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Đang tải...</span>
              <span className="text-slate-400">
                {downloadedChapters} / {totalChapters}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="h-2 bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${(downloadedChapters / totalChapters) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={18} />
              <p className="text-sm text-green-300">Tải thành công!</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          {!isDownloaded ? (
            <>
              <button
                onClick={handleDownload}
                disabled={status === 'downloading' || status === 'checking'}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                  font-medium transition-colors
                  ${
                    status === 'downloading' || status === 'checking'
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : status === 'error'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
              >
                <Download size={16} />
                {status === 'checking'
                  ? 'Kiểm tra...'
                  : status === 'downloading'
                  ? 'Đang tải...'
                  : status === 'error'
                  ? 'Thử lại'
                  : 'Tải offline'}
              </button>
              <button
                onClick={onClose}
                className="
                  px-4 py-2 text-slate-300 hover:text-slate-100
                  border border-slate-600 hover:border-slate-500 rounded-lg
                  transition-colors
                "
              >
                Đóng
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="
                  flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700
                  text-white rounded-lg font-medium transition-colors
                "
              >
                Đọc ngay
              </button>
              <button
                onClick={handleDelete}
                className="
                  px-4 py-2 text-red-300 hover:text-red-100
                  border border-red-600 hover:border-red-500 rounded-lg
                  transition-colors
                "
              >
                Xoá
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-slate-400">
          💡 Tải truyện để đọc khi không có internet. Dữ liệu lưu trên thiết bị
          của bạn.
        </p>
      </div>
    </Modal>
  );
}
