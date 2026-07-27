/* ============================================================
   EDU-CORE UGANDA — SERVICE WORKER
   PWA offline shell + caching strategy
   ============================================================ */

const CACHE_NAME = 'educore-v1';
const STATIC_ASSETS = [
  '/',
  '/css/reset.css',
  '/css/tokens.css',
  '/css/utilities.css',
  '/css/animations.css',
  '/css/components.css',
  '/js/app.js',
  '/js/utils/api.js',
  '/js/utils/animate.js',
  '/js/utils/notifications.js',
  '/js/utils/shimmer.js',
  '/js/utils/tenant.js',
  '/pages/login.html',
  '/manifest.json'
];

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});

/**
 * Activate event - Clean old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

/**
 * Fetch event - Network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls (let them handle offline themselves)
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the fresh response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If HTML request, return offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/pages/login.html');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
