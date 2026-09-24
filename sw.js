// Offline support: caches the site on the first visit, and all lessons in the language the page asks for
// (Russian or Ukrainian), so everything works offline like in the Android app.
// Bump VERSION when files change, so browsers replace the old cache.
const VERSION = 'v5';
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
  'data/categories.json',
  'data/about/en.html',
  'data/about/ru.html',
  'data/about/uk.html',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
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

const LESSON_FOLDERS = ['data/lessons', 'data/lessons-uk'];

// the page sends {cacheLessons: folder} with the folder of its language
self.addEventListener('message', event => {
  const folder = event.data && event.data.cacheLessons;
  if (!LESSON_FOLDERS.includes(folder)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const lessons = await (await cache.match('data/lessons.json')).json();
    const missing = [];
    for (const lesson of lessons) {
      const url = `${folder}/${lesson.id}.html`;
      if (!(await cache.match(url))) missing.push(url);
    }
    await cache.addAll(missing);
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
