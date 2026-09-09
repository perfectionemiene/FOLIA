const CACHE_NAME = 'folia-cache-v1';

// List all files to cache for offline use
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './pages/dashboard.html',
  './pages/library.html',
  './pages/add-book.html',
  './pages/analytics.html',
  './pages/goals.html',
  './pages/profile.html',
  './pages/settings.html',
  './pages/register.html',
  './pages/signup.html',
  './css/variables.css',
  './css/global.css',
  './js/app.js',
  'https://unpkg.com/lucide@latest'
];

// Install Event: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Serve cached assets when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for document navigation if offline
        if (event.request.mode === 'navigate') {
          return caches.match('./pages/dashboard.html');
        }
      });
    })
  );
});