// Bump this version string any time you update any file in the suite,
// so the service worker knows to re-cache everything.
const CACHE_NAME = 'mini-games-v1';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './hp-tracker.html',
  './scoundrel.html',
  './regicide.html',
  './matching.html',
  './bogey.html',
  './card-capture.html',
  './fonts.css',
  './manifest.json',
  './favicon-32.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Cache everything on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache-first: serve from cache, fall back to network, fall back to cache on failure
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache newly-seen same-origin files too (e.g. future additions)
          if (event.request.url.startsWith(self.location.origin)) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
    })
  );
});
