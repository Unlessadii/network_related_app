const CACHE_NAME = 'netbypass-v1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app',
  '/admin',
  '/public/manifest.json',
  '/frontend/assets/icon.svg',
  '/frontend/styles/app.css',
  '/frontend/styles/admin.css',
  '/frontend/app/app.js',
  '/frontend/admin/admin.js',
  '/frontend/offline/db.js',
  '/frontend/offline/sync-engine.js',
  '/frontend/services/api.js',
  '/frontend/services/auth.js',
  '/frontend/components/ui-components.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap'
];

// Install: pre-cache static application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching application shell...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets failed to pre-cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API GET requests: Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/') && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid response, clone into cache for offline viewing
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              const headers = new Headers(cachedResponse.headers);
              headers.set('X-NetBypass-Offline', 'true');
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
              });
            }
            return new Response(JSON.stringify({
              success: false,
              message: 'Device is offline and requested data is not yet in local cache.',
              is_offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Non-GET API requests: bypass cache, let app offline queue handle offline state
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static Assets & Shell Pages: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, nothing extra to do if cachedResponse already exists
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync Event (Standard Web API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' });
        });
      })
    );
  }
});
