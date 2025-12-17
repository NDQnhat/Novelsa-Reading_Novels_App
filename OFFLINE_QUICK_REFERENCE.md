# Quick Reference: Offline PWA Features

## For Developers

### Using the Offline State Hook

```typescript
import { useOfflineState, OfflineIndicator } from './hooks/useOfflineState';

export function MyComponent() {
  const offlineState = useOfflineState();

  // Check if online
  if (!offlineState.isOnline) {
    return <p>You're offline - limited features available</p>;
  }

  // Disable features when offline
  if (offlineState.isOnline) {
    // Can sync/upload
  }

  // Show offline indicator
  return <OfflineIndicator state={offlineState} />;
}
```

### Working with IndexedDB

```typescript
import { indexedDB } from '../services/indexedDBService';

// Save novel
await indexedDB.saveNovel({
  id: '123',
  title: 'Novel Name',
  author: 'Author Name',
  // ... other fields
  savedAt: Date.now(),
  fromCache: true,
});

// Get all novels
const novels = await indexedDB.getAllNovels();

// Delete novel (cascades to chapters + images)
await indexedDB.deleteNovel('123');

// Save read position
await indexedDB.saveReadPosition({
  novelId: '123',
  chapterId: 'ch-1',
  chapterNumber: 5,
  scrollPosition: 0,
  readAt: Date.now(),
});

// Get storage info
const info = await indexedDB.getStorageInfo();
console.log(`Using ${info.percentUsed}% of quota`);
```

### Offline Routes Configuration

Edit `OFFLINE_ROUTES_REGEX` in `client/public/service-worker.js`:

```javascript
const OFFLINE_ROUTES_REGEX = [
  /^\/offline-library/,      // Browse cached novels
  /^\/offline-reader\/[^/]+$/, // Read chapters
  /^\/offline$/,              // Fallback page
  /^\/offline-favorites/,     // Future: bookmarks
];
```

### Checking Service Worker Status

```typescript
// In DevTools Console
navigator.serviceWorker.controller?.state
// Returns: "installing" | "installed" | "activating" | "activated" | "redundant"

// List active caches
caches.keys().then(names => console.log(names));
// Output: ["shell-v2.0.0", "images-v2.0.0", "api-v2.0.0"]

// Clear all caches (dev only)
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);
```

### Testing Offline Mode

**Chrome DevTools:**
1. F12 → Application tab
2. Service Workers → Check "Offline" checkbox
3. Reload page → App continues working

**Network Throttling:**
1. F12 → Network tab
2. Set throttle to "Offline"
3. Try API calls → Falls back to cache

**IndexedDB Inspection:**
1. F12 → Application → Storage → IndexedDB
2. Click `novelReaderDB`
3. Inspect stores and data

---

## For Users

### Download a Novel

1. View novel detail page
2. Click **📥 Tải offline** button
3. Wait for chapters to download (shows progress)
4. Click **Đọc ngay** when complete
5. Novel available in **📚 Thư viện Offline**

### Read Offline

1. Go offline (airplane mode / disconnect WiFi)
2. Open **📚 Thư viện Offline** from menu
3. Click novel to open reader
4. Use navigation buttons to change chapters
5. Position auto-saves when switching chapters

### Check Storage

- View storage usage in **Thư viện Offline**
- Progress bar shows % of available space
- **Dọn dẹp dữ liệu cũ** removes novels not read in 30 days

### Free Up Space

- Click **🗑️** on novel to delete it
- Or use "Cleanup old data" button
- Reclaims storage for new novels

---

## Architecture Overview

```
Client
├── Service Worker (SW)
│   ├── Install: Cache app shell
│   ├── Fetch: Intercept & route requests
│   └── Activate: Clean up old caches
│
├── IndexedDB
│   ├── novels: Novel metadata + cover images
│   ├── chapters: Full chapter content
│   ├── lastReadPositions: Resume position
│   └── offlineImages: Additional images
│
└── React Components
    ├── OfflineLibrary: Browse cached novels
    ├── OfflineReader: Read chapters
    ├── DownloadModal: Download new novels
    └── OfflineIndicator: Status display

API Server (online only)
└── Provides: Novel data, chapters, images
```

---

## Performance Tips

### For Best Offline Experience

1. **Download popular novels** before traveling
2. **Use WiFi** to download (faster chapters)
3. **Enable offline mode** in settings (future feature)
4. **Clear old novels** occasionally to free space
5. **Keep app updated** for latest improvements

### Developer Optimization

1. **Compress chapter images** before upload (< 100KB)
2. **Lazy-load chapter images** (not in first request)
3. **Batch save chapters** instead of individual saves
4. **Monitor storage quota** with analytics
5. **Cache API responses** by URL in Service Worker

---

## Troubleshooting

### "Novel still showing 0% offline"
- Service Worker may not be registered yet
- Refresh page: Ctrl+Shift+R (hard refresh)
- Check DevTools → Application → Service Workers

### "Can't read offline novel"
- IndexedDB may be disabled (check browser settings)
- Storage quota exceeded (delete old novels)
- Chapter content wasn't fully downloaded

### "App is slow offline"
- Clear old caches: DevTools → Application → Clear Storage
- Reduce number of cached novels
- Disable auto-refetch in offline mode

### "Storage quota warning"
- Delete novels you've finished reading
- Use cleanup feature to auto-remove old data
- Request larger quota (browser will prompt)

---

## Useful Commands (Console)

```javascript
// Check SW registration
navigator.serviceWorker.getRegistrations().then(regs => 
  console.log(regs.length + ' SWs registered')
);

// Check IndexedDB size (approx)
indexedDB.databases().then(dbs => console.log(dbs));

// Get storage estimate
navigator.storage.estimate().then(est => 
  console.log(`${Math.round(est.usage/1024/1024)}MB / ${Math.round(est.quota/1024/1024)}MB`)
);

// Unregister all SWs
navigator.serviceWorker.getRegistrations().then(regs =>
  Promise.all(regs.map(r => r.unregister()))
);

// Clear IndexedDB
indexedDB.databases().then(dbs =>
  dbs.forEach(db => indexedDB.deleteDatabase(db.name))
);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.0.0 | 2025-12-17 | Initial offline PWA implementation |
| v1.0.0 | 2025-12-01 | Core app launch |

---

**Questions? Check OFFLINE_IMPLEMENTATION_SUMMARY.md for detailed docs.**
