// Offline support: caches the site and all lessons on the first visit (the Android app worked offline too).
// Bump VERSION when files change, so browsers replace the old cache.
const VERSION = 'v2';
const CACHE = `mobile-grammar-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/i18n.js',
  'js/store.js',
  'js/reminder.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'data/lessons.json',
  'data/chapters.json',
  'data/categories.json',
  'data/about/en.html',
  'data/about/ru.html',
  'data/about/uk.html',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    const lessons = await (await cache.match('data/lessons.json')).json();
    await cache.addAll(lessons.map(lesson => `data/lessons/${lesson.id}.html`));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('mobile-grammar-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// cached answer right away, fresh copy from the network for the next time
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = request.mode === 'navigate' ? './' : request;
    const cached = await cache.match(key, { ignoreSearch: true });
    const network = fetch(request).then(response => {
      if (response.ok) cache.put(key, response.clone());
      return response;
    });
    if (cached) {
      event.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  })());
});
