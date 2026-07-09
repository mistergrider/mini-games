// HTML pages are network-first, so editing a .html file and re-uploading it
// is enough — no version bump needed for those. Still bump this string if
// you change a static asset (fonts.css, an icon, manifest.json), so the
// cache-first fetch for those picks up the new version.
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

// HTML pages (index + games): network-first, so online users always get the
// latest version. Falls back to cache when offline.
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    })
    .catch(() => caches.match(request));
}

// Static assets (fonts, icons, manifest): cache-first, since these rarely
// change and it's faster to serve straight from cache.
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    });
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHTML =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  if (isHTML) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});
