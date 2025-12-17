# Production Deployment Guide - Novelsa Offline PWA

**Last Updated:** December 17, 2025  
**Version:** v2.0.0

---

## Pre-Deployment Checklist

### Code Quality
- ✅ All TypeScript compilation errors: **0**
- ✅ All imports/exports correct
- ✅ Service Worker registered properly
- ✅ IndexedDB schema initialized
- ✅ Components integrated into main App

### Environment Setup
```env
# .env.production
VITE_API_URL=https://api.novelsa.com/api
NODE_ENV=production
```

### HTTPS Required
```
❌ HTTP (Service Worker NOT available)
✅ HTTPS (Service Worker works correctly)
```

---

## Build Configuration

### Vite Config (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
})
```

### Build Command
```bash
npm run build
# Output: /dist directory with all assets
```

### Build Output Structure
```
dist/
├── index.html                    (entry point)
├── service-worker.js             (SW from public/)
├── assets/
│   ├── main.*.js
│   ├── main.*.css
│   ├── ...chunks.*.js
│   └── ...vendor.*.js
└── favicon.ico
```

---

## Server Configuration

### Static File Serving
```nginx
# nginx.conf
server {
  listen 443 ssl http2;
  server_name api.novelsa.com;
  
  root /var/www/novelsa/dist;
  
  # HTTPS/TLS
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  # Service Worker
  location = /service-worker.js {
    add_header Cache-Control "max-age=0, must-revalidate";
    add_header Service-Worker-Allowed "/";
  }
  
  # App Shell (index.html)
  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "max-age=3600, must-revalidate";
  }
  
  # Assets (JS, CSS)
  location /assets {
    add_header Cache-Control "max-age=31536000, immutable";
    expires 1y;
  }
}
```

### Express.js Alternative
```typescript
// server.ts
import express from 'express';
import path from 'path';

const app = express();

// Serve SW with no cache
app.get('/service-worker.js', (req, res) => {
  res.set('Cache-Control', 'max-age=0, must-revalidate');
  res.set('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, '../dist/service-worker.js'));
});

// Serve app shell
app.get('/', (req, res) => {
  res.set('Cache-Control', 'max-age=3600, must-revalidate');
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, '../dist/assets'), {
  maxAge: '1y',
  etag: false,
}));

// SPA routing fallback
app.get('*', (req, res) => {
  res.set('Cache-Control', 'max-age=3600, must-revalidate');
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## API Server Setup

### CORS Configuration
```typescript
// api/src/server.ts
import cors from 'cors';

app.use(cors({
  origin: 'https://novelsa.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### API Endpoints Required
```
GET    /api/novels                 # Get all novels
GET    /api/novels/:id             # Get single novel
GET    /api/novels/:id/chapters    # Get chapters
GET    /api/novels/:id/chapters/:cid # Get chapter content
POST   /api/novels                 # Create novel (auth required)
PUT    /api/novels/:id             # Update novel
DELETE /api/novels/:id             # Delete novel
POST   /api/auth/login             # User login
POST   /api/auth/register          # User registration
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

---

## Database Optimization

### MongoDB Indexes
```javascript
// Create these indexes for fast offline data retrieval
db.novels.createIndex({ authorId: 1 });
db.novels.createIndex({ status: 1 });
db.novels.createIndex({ createdAt: -1 });

db.chapters.createIndex({ novelId: 1 });
db.chapters.createIndex({ order: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
```

### Database Cleanup (30-day old records)
```javascript
// Run monthly via cron job
db.novels.deleteMany({
  updatedAt: { $lt: Date.now() - 30*24*60*60*1000 },
  status: 'DRAFT'
});
```

---

## Monitoring & Logging

### Service Worker Errors
```typescript
// In app.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('error', (event) => {
    console.error('[SW Error]', event.error);
    // Send to error tracking service
    reportError('service-worker', event.error);
  });
}
```

### IndexedDB Quota Monitoring
```typescript
// Monitor storage usage
setInterval(async () => {
  const estimate = await navigator.storage.estimate();
  const percentUsed = (estimate.usage / estimate.quota) * 100;
  
  if (percentUsed > 90) {
    console.warn('[Storage] 90% quota used');
    // Alert user to cleanup
  }
}, 60000); // Every 1 minute
```

### Analytics Events
```typescript
// Track offline events
window.addEventListener('online', () => {
  analytics.track('user_came_online');
});

window.addEventListener('offline', () => {
  analytics.track('user_went_offline');
});
```

---

## Security Considerations

### Content Security Policy
```typescript
// app.tsx or server middleware
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // For React dev tools
    "style-src 'self' 'unsafe-inline'",   // For Tailwind
    "img-src 'self' https: data:",
    "connect-src 'self' https://api.novelsa.com",
    "font-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; '));
  next();
});
```

### Service Worker Security
- Only register over HTTPS
- Validate origin in SW
- Don't cache sensitive data
- Clear cookies in offline mode

### IndexedDB Encryption
```typescript
// For sensitive data, encrypt before storing
import { encrypt, decrypt } from 'crypto-js';

// Store encrypted
const encrypted = encrypt(userData, secretKey);
await indexedDB.saveNovel(encrypted);

// Retrieve and decrypt
const encrypted = await indexedDB.getNovel(id);
const decrypted = decrypt(encrypted, secretKey);
```

---

## Performance Optimization

### Cache Strategy Timing

```
App Shell (JS, CSS, fonts)
├─ Cache-First
├─ Max-age: 1 year (immutable hashes)
└─ Fallback: Re-download on new build

Static Assets
├─ Cache-First
├─ Max-age: 1 month
└─ Fallback: Serve from cache

API Responses
├─ Network-First (5s timeout)
├─ Cache-First (fallback)
├─ IndexedDB (last resort)
└─ Error response (network down)

Images
├─ Cache-First
├─ Max-age: 3 months
└─ Placeholder on miss
```

### Bundle Size Analysis
```bash
# Check what's in the bundle
npm install --save-dev webpack-bundle-analyzer

# Analyze
npm run analyze
```

### Compression
```nginx
# In nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;
```

---

## Disaster Recovery

### Clear All Offline Data (User Request)
```typescript
async function clearAllOfflineData() {
  if (!confirm('This will delete all offline data. Are you sure?')) return;
  
  // Clear caches
  caches.keys().then(names => 
    Promise.all(names.map(name => caches.delete(name)))
  );
  
  // Clear IndexedDB
  await indexedDB.clearAll();
  
  // Clear service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    registrations.forEach(reg => reg.unregister());
  }
  
  window.location.reload();
}
```

### SW Update Failure Recovery
```typescript
// Auto-unregister broken SW after 5 update attempts
let updateAttempts = 0;
const MAX_ATTEMPTS = 5;

async function attemptUpdate() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg.update();
    updateAttempts = 0; // Reset on success
  } catch (err) {
    updateAttempts++;
    if (updateAttempts >= MAX_ATTEMPTS) {
      // Unregister broken SW
      const reg = await navigator.serviceWorker.getRegistration();
      await reg.unregister();
      window.location.reload();
    }
  }
}
```

---

## Rollback Plan

### If Offline Features Cause Issues

```bash
# 1. Revert to previous version
git revert HEAD~5

# 2. Remove Service Worker
rm public/service-worker.js

# 3. Disable offline components in App.tsx
# Comment out: import OfflineLibrary, OfflineReader, useOfflineState

# 4. Rebuild & redeploy
npm run build
npm run deploy
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri "mongodb://..." --archive=backup.archive

# Verify data integrity
db.novels.count()
db.chapters.count()
db.users.count()
```

---

## Testing in Production

### Smoke Tests
```javascript
// Run these in DevTools console after deploy

// 1. Check SW registered
navigator.serviceWorker.getRegistrations().then(r => console.log('SWs:', r.length));

// 2. Check caches
caches.keys().then(k => console.log('Caches:', k));

// 3. Check IndexedDB
indexedDB.databases().then(d => console.log('DBs:', d));

// 4. Download a novel
// Navigate to novel, click Download button

// 5. Go offline (DevTools)
// Try to read the novel

// 6. Come back online
// Verify sync completes
```

### Performance Monitoring
```typescript
// Check Core Web Vitals
web-vitals.getCLS(console.log);
web-vitals.getFID(console.log);
web-vitals.getLCP(console.log);

// Check cache effectiveness
performance.getEntriesByType('navigation').forEach(nav => {
  console.log('Time to First Byte:', nav.responseStart - nav.requestStart);
  console.log('DOM Content Loaded:', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
});
```

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Clear old caches | Weekly | Automated |
| Review error logs | Daily | DevOps |
| Monitor storage quota | Daily | Analytics |
| Update dependencies | Monthly | Engineering |
| Database cleanup | Monthly | DBA |
| Security scan | Quarterly | Security |
| Performance audit | Quarterly | Frontend |

---

## Support Resources

- **Service Worker Debugging:** DevTools → Application → Service Workers
- **IndexedDB Inspector:** DevTools → Application → Storage → IndexedDB
- **Cache Inspector:** DevTools → Application → Cache Storage
- **Network Throttling:** DevTools → Network → Set to "Offline"
- **Lighthouse PWA Audit:** DevTools → Lighthouse → PWA

---

## Deployment Checklist

- [ ] HTTPS enabled on production domain
- [ ] Service Worker at `/service-worker.js`
- [ ] API endpoints responding correctly
- [ ] CORS configured for frontend domain
- [ ] Database indexes created
- [ ] Environment variables set
- [ ] Error tracking configured
- [ ] Analytics events working
- [ ] Offline functionality tested
- [ ] Smoke tests passing
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Success Criteria

✅ Service Worker registers without errors  
✅ Novel download completes successfully  
✅ Offline reading works with no internet  
✅ Storage quota properly monitored  
✅ No unhandled errors in console  
✅ Response time < 1 second (cached)  
✅ Update notification appears when new version available  

---

**Deployment Status: ✅ Ready for Production**

Questions? Check the docs:
- OFFLINE_IMPLEMENTATION_SUMMARY.md (technical details)
- OFFLINE_QUICK_REFERENCE.md (user & developer guide)
- OFFLINE_INTEGRATION_COMPLETE.md (integration checklist)
