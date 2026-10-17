// Service worker for the installed app. Pages and data always come from the
// network when it answers, so routes stay current; the last copy of each
// file is kept so pages already opened still load with poor signal.
const CACHE = 'sale-routes-v1';
const SHELL = [
  './',
  'pages.json',
  'manifest.webmanifest',
  'assets/sale-route.css',
  'assets/sale-route.js',
  'assets/index.js',
  'assets/app.js',
  'assets/icon-192.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })
        .then(cached => cached || Response.error())));
});
