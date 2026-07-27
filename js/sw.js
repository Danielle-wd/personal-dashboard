/**
 * Service Worker - Cache-first strategy for PWA
 */
const CACHE_NAME = 'wb-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/storage.js',
  '/js/todo.js',
  '/js/notes.js',
  '/js/english.js',
  '/js/fitness.js',
  '/js/jobs.js',
  '/js/media.js',
  '/js/capture.js',
  '/js/home.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => {
    return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
