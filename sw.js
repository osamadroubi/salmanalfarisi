const CACHE_NAME = 'salman-farsi-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './sources.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/img/hero.svg',
  './assets/img/intro_question.svg',
  './assets/img/persia_fire.svg',
  './assets/img/church_moment.svg',
  './assets/img/teachers_chain.svg',
  './assets/img/three_signs.svg',
  './assets/img/freedom_palms.svg',
  './assets/img/trench_city.svg',
  './assets/img/belonging_circle.svg',
  './assets/img/balance_rights.svg',
  './assets/img/stars_thuraya.svg',
  './assets/img/madain_humility.svg',
  './assets/img/farewell_madain.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
