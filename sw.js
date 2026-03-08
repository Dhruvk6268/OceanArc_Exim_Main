const CACHE_VERSION = 'oceanarc-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/all-min.css',
  './js/layout.js',
  './js/main.js',
  './components/header.html',
  './components/footer.html',
  './images/logo.svg',
  './images/logo.png'
];

const STATIC_DESTINATIONS = new Set(['style', 'script', 'font', 'image']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => !key.startsWith(CACHE_VERSION))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldBypassCache(url.pathname)) return;

  if (isHTMLRequest(request)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, RUNTIME_CACHE));
});

function shouldBypassCache(pathname) {
  return pathname.includes('/admin-')
    || pathname.startsWith('/api/')
    || pathname.startsWith('/php/')
    || pathname.endsWith('.php');
}

function isHTMLRequest(request) {
  return request.mode === 'navigate'
    || request.destination === 'document'
    || (request.headers.get('accept') || '').includes('text/html');
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (isCacheable(response)) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  throw new Error('No cached response available');
}

function isCacheable(response) {
  return response && response.ok && response.type !== 'opaque';
}
