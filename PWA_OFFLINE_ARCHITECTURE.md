# 📚 PWA Offline Architecture - Web App Đọc Truyện

## 🎯 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    React App (Client)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Offline Detector (Context)                       │   │
│  │ - navigator.onLine                              │   │
│  │ - online/offline events                         │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Router + Protected Routes                       │   │
│  │ - OFFLINE_ROUTES (whitelist)                   │   │
│  │ - Redirect to /offline nếu offline             │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ IndexedDB Manager                               │   │
│  │ - novels, chapters, lastReadPosition            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
              ↓                              ↓
     [Service Worker]              [API Client]
     (offline first)                (with fallback)
```

---

## 1️⃣ Kiến trúc Offline - Flow hoạt động

### A. Khi ONLINE:
```
User Action → API Request → Service Worker (Network First)
                              ↓
                    Backend API Response
                              ↓
                   Update IndexedDB + Cache
                              ↓
                    React Component Update
```

### B. Khi OFFLINE:
```
User Action → Route Check
              ↓
         Is route allowed?
         /         \
       YES         NO
        ↓           ↓
   Load from    Show "/offline"
   IndexedDB    Page
```

### C. Quá trình tải truyện offline:
```
1. User click "Tải về"
   ↓
2. Download tất cả chapters từ API
   ↓
3. Download cover + chapter images từ API
   ↓
4. Save vào IndexedDB + Cache API
   ↓
5. Show badge "Đã tải offline"
```

---

## 2️⃣ Danh sách Routes Offline

### Whitelist Routes:
```javascript
const OFFLINE_ROUTES = {
  // Exact matches
  EXACT: ['/offline-library', '/offline', '/offline-favorites'],
  
  // Dynamic routes (prefix matching)
  DYNAMIC: [
    { pattern: '/offline-reader/:id', regex: /^\/offline-reader\/[^/]+$/ },
    { pattern: '/offline-novel/:id', regex: /^\/offline-novel\/[^/]+$/ },
  ],
};

// Hàm check route được phép offline
function isOfflineAllowedRoute(pathname) {
  // Check exact
  if (OFFLINE_ROUTES.EXACT.includes(pathname)) return true;
  
  // Check dynamic
  return OFFLINE_ROUTES.DYNAMIC.some(route => route.regex.test(pathname));
}
```

---

## 3️⃣ Service Worker - Chiến lược Cache

### Strategy:
```
┌─────────────────────┬──────────────────────┬─────────────┐
│   Loại Request      │    Chiến lược        │  Fallback   │
├─────────────────────┼──────────────────────┼─────────────┤
│ App Shell (JS/CSS)  │ Cache First          │ Network     │
│ Images              │ Cache First          │ Default img │
│ API Calls           │ Network First        │ IndexedDB   │
│ HTML Pages          │ Network First        │ /offline    │
└─────────────────────┴──────────────────────┴─────────────┘
```

---

## 4️⃣ IndexedDB Schema

### Database: `novelReaderDB` (v2)
```javascript
{
  novels: {
    keyPath: 'id',
    indexes: ['status', 'authorId', 'lastModified'],
    // {
    //   id, title, description, coverUrl, authorId,
    //   downloadedAt, isOfflineAvailable, status
    // }
  },
  
  chapters: {
    keyPath: ['novelId', 'id'],
    indexes: ['novelId', 'order'],
    // {
    //   novelId, id, title, content, images,
    //   order, downloadedAt, isRead
    // }
  },
  
  lastReadPosition: {
    keyPath: 'novelId',
    // { novelId, chapterId, scrollPosition, readAt }
  },
  
  offlineImages: {
    keyPath: 'url',
    indexes: ['novelId'],
    // { url, blob, downloadedAt, novelId }
  }
}
```

---

## 5️⃣ Edge Cases & Giải pháp

| Edge Case | Giải pháp |
|-----------|----------|
| IndexedDB bị quota exceed | Cleanup oldest novels + warn user |
| Safari iOS 5MB limit | Compress images, limit chapters/novel |
| User offline → navigate to undownloaded novel | Show helpful modal → suggest offline routes |
| Service Worker update conflict | Versioning + auto-refresh on activate |
| Network flaky (online/offline toggle) | Implement retry logic + smart fallback |
| User clear browser data | Check IndexedDB available → fallback to empty state |

---

## 6️⃣ Best Practices

✅ **DO:**
- Use structured clone cho nested objects
- Implement background sync cho pending actions
- Show clear offline indicators
- Cache busting cho versioned assets
- Gzip compression cho large data
- Lazy load IndexedDB queries

❌ **DON'T:**
- Store sensitive data (tokens, passwords) unencrypted
- Block UI khi reading IndexedDB
- Assume Service Worker always succeeds
- Cache API responses without expiry
- Ignore browser storage quota warnings

---

## 7️⃣ Monitoring & Debugging

```javascript
// Log service worker lifecycle
console.log('[SW] Install:', version);
console.log('[SW] Activate:', caches cleared);
console.log('[SW] Fetch:', url, strategy, success);

// IndexedDB size check
async function getDBSize() {
  if (navigator.storage) {
    const estimate = await navigator.storage.estimate();
    console.log(`Storage: ${estimate.usage}/${estimate.quota}`);
  }
}
```

---

## 📊 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| First Load (offline) | < 2s | Cache hit on App Shell |
| Load Chapter Offline | < 500ms | IndexedDB query |
| Download Novel (100 chapters) | < 60s | Batch requests, compress |
| Cache Size Limit | 500MB | Adjust per platform |
| IndexedDB Size Limit | 50MB/novel | Compress content |

