/**
 * Service Worker cho Novelsa Reading App
 * Chiến lược: Cache First + Network First + IndexedDB Fallback
 */

const SW_VERSION = 'v2.0.0';
const CACHE_NAMES = {
  SHELL: `shell-${SW_VERSION}`,
  IMAGES: `images-${SW_VERSION}`,
  API: `api-${SW_VERSION}`,
};

// App Shell assets (cache on install)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/offline.html',
];

// Routes được phép offline (từ App logic)
const OFFLINE_ROUTES_REGEX = [
  /^\/offline-library/,
  /^\/offline$/,
  /^\/offline-reader\/[^/]+$/,
  /^\/offline-novel\/[^/]+$/,
  /^\/offline-favorites/,
];

/**
 * ============ INSTALL EVENT ============
 * Cache app shell + offline fallback
 */
self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  
  event.waitUntil(
    (async () => {
      try {
        const shellCache = await caches.open(CACHE_NAMES.SHELL);
        
        // Parallel cache - retry nếu fail (network issues)
        const results = await Promise.allSettled(
          SHELL_ASSETS.map((asset) =>
            fetch(asset, { credentials: 'omit' })
              .then((res) => {
                if (!res.ok) throw new Error(`${asset}: ${res.status}`);
                return shellCache.put(asset, res.clone());
              })
          )
        );
        
        // Log failures nhưng continue
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.warn(`[SW] Failed to cache: ${SHELL_ASSETS[i]}`);
          }
        });
        
        // Cache offline fallback
        const offlineHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Ngoại tuyến</title>
            <style>
              * { margin: 0; padding: 0; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #0f172a;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
              }
              .container {
                text-align: center;
                max-width: 400px;
                padding: 20px;
              }
              h1 { font-size: 32px; margin-bottom: 16px; }
              p { color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
              a {
                display: inline-block;
                background: #f59e0b;
                color: #0f172a;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📱 Bạn đang ngoại tuyến</h1>
              <p>Trang này cần kết nối internet để truy cập.</p>
              <p>Nhưng bạn vẫn có thể đọc những truyện đã tải về offline.</p>
              <a href="/offline-library">Đi đến thư viện offline</a>
            </div>
          </body>
          </html>
        `;
        
        await shellCache.put(
          '/offline.html',
          new Response(offlineHTML, { headers: { 'Content-Type': 'text/html' } })
        );
        
        console.log('[SW] Install complete - Shell cached');
        self.skipWaiting(); // Activate immediately
      } catch (err) {
        console.error('[SW] Install failed:', err);
      }
    })()
  );
});

/**
 * ============ ACTIVATE EVENT ============
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCaches = Object.values(CACHE_NAMES);
      
      await Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      self.clients.claim(); // Take control immediately
      console.log('[SW] Activate complete');
    })()
  );
});

/**
 * ============ FETCH EVENT ============
 * Main offline-first logic
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Route-specific handling
  if (url.origin === self.location.origin) {
    // HTML page request
    if (request.destination === 'document') {
      return event.respondWith(handlePageRequest(request, url));
    }
    
    // API request
    if (url.pathname.startsWith('/api')) {
      return event.respondWith(handleAPIRequest(request, url));
    }
    
    // Image request
    if (request.destination === 'image') {
      return event.respondWith(handleImageRequest(request, url));
    }
    
    // App Shell (JS, CSS, fonts)
    if (
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font'
    ) {
      return event.respondWith(handleShellRequest(request, url));
    }
  }
  
  // External requests (CDN, analytics)
  return event.respondWith(handleExternalRequest(request));
});

/**
 * ============ HANDLERS ============
 */

/**
 * Handle HTML pages (documents)
 * Strategy: Network First → Cache → Offline Page
 */
async function handlePageRequest(request, url) {
  try {
    // Try network first (always fresh content)
    const networkResponse = await fetch(request, { 
      credentials: 'include' 
    });
    
    if (networkResponse.ok) {
      // Cache for offline - clone response
      const cache = await caches.open(CACHE_NAMES.SHELL);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (err) {
    console.log('[SW] Network failed for page:', url.pathname);
  }
  
  // Check if route is allowed offline
  if (isOfflineRoute(url.pathname)) {
    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Fallback to app shell
    return caches.match('/index.html') || caches.match('/');
  }
  
  // Route tidak được phép offline → show offline page
  return caches.match('/offline.html') ||
    new Response('Offline - Offline page not cached', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
}

/**
 * Handle API requests
 * Strategy: Network First → IndexedDB → Error Response
 */
async function handleAPIRequest(request, url) {
  try {
    // Always try network first (latest data)
    const networkResponse = await Promise.race([
      fetch(request, { credentials: 'include' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);
    
    if (networkResponse.ok) {
      // Cache API response
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request.clone(), networkResponse.clone());
      
      return networkResponse;
    }
  } catch (err) {
    console.log('[SW] Network failed for API:', url.pathname, err.message);
  }
  
  // Try cache
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  // Try IndexedDB for specific endpoints
  if (url.pathname.includes('/novels')) {
    const dbResponse = await tryIndexedDBFallback(url);
    if (dbResponse) {
      return dbResponse;
    }
  }
  
  // Return offline error
  return new Response(
    JSON.stringify({ 
      error: 'Offline - No cached data available',
      offline: true 
    }),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Handle images
 * Strategy: Cache First → Network → Default placeholder
 */
async function handleImageRequest(request, url) {
  const cache = await caches.open(CACHE_NAMES.IMAGES);
  
  // Try cache first
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request, { 
      credentials: 'omit' 
    });
    
    if (networkResponse.ok) {
      // Cache for future
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
  } catch (err) {
    console.log('[SW] Failed to fetch image:', url.pathname);
  }
  
  // Return transparent 1x1 placeholder
  return new Response(
    new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
    ]),
    { headers: { 'Content-Type': 'image/png' } }
  );
}

/**
 * Handle App Shell (JS, CSS, fonts)
 * Strategy: Cache First → Network
 */
async function handleShellRequest(request, url) {
  const cache = await caches.open(CACHE_NAMES.SHELL);
  
  // Try cache first (instant load)
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    // Try network (new version)
    const networkResponse = await fetch(request, { 
      credentials: 'omit' 
    });
    
    if (networkResponse.ok) {
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
  } catch (err) {
    console.log('[SW] Failed to fetch shell:', url.pathname);
  }
  
  // Fallback to cached version if available
  return cache.match(request) ||
    new Response('Not found', { status: 404 });
}

/**
 * Handle external requests (CDN, analytics)
 * Strategy: Network Only (no offline support)
 */
async function handleExternalRequest(request) {
  try {
    return await fetch(request);
  } catch (err) {
    console.log('[SW] External request failed:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * ============ HELPERS ============
 */

/**
 * Check if route is allowed offline
 */
function isOfflineRoute(pathname) {
  return OFFLINE_ROUTES_REGEX.some((regex) => regex.test(pathname));
}

/**
 * Try to get data from IndexedDB
 * Fallback cho API requests khi offline
 */
async function tryIndexedDBFallback(url) {
  try {
    // Parse what we need from URL
    // /api/novels/:id/chapters → get from IndexedDB
    
    const match = url.pathname.match(/\/api\/novels\/([^/]+)/);
    if (!match) return null;
    
    const novelId = match[1];
    const idb = await openIndexedDB();
    
    if (url.pathname.includes('/chapters')) {
      // Return chapters from IndexedDB
      const chapters = await idb
        .transaction(['chapters'], 'readonly')
        .objectStore('chapters')
        .getAll(IDBKeyRange.bound([novelId], [novelId, '\uffff']));
      
      return new Response(
        JSON.stringify({ success: true, data: chapters, fromCache: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return novel from IndexedDB
    const novel = await idb
      .transaction(['novels'], 'readonly')
      .objectStore('novels')
      .get(novelId);
    
    if (novel) {
      return new Response(
        JSON.stringify({ success: true, data: novel, fromCache: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('[SW] IndexedDB fallback error:', err);
  }
  
  return null;
}

/**
 * Open IndexedDB connection
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('novelReaderDB', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

console.log(`[Service Worker ${SW_VERSION}] Loaded`);
