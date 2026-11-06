// Offline support: pages are network-first, hashed build assets are cache-first.
const CACHE = 'solar-quote-v2';
const scope = self.registration.scope;
const pages = ['', 'proposal', 'quotes'].map((path) => new URL(path, scope).href);
const files = ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'solar-roof.webp', 'manifest.webmanifest']
  .map((path) => new URL(path, scope).href);
const buildAsset = /\/_next\/static\/[\w\-./]+\.(?:js|css|woff2?)/g;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(files);
    for (const page of pages) {
      const response = await fetch(page, { cache: 'reload' });
      if (!response.ok) continue;
      await cache.put(page, response.clone());
      // Pre-cache the scripts and styles the page needs so it also opens offline on first use.
      const assets = new Set((await response.text()).match(buildAsset) ?? []);
      await Promise.all([...assets].map((asset) => cache.add(new URL(asset, scope).href).catch(() => {})));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('solar-quote-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && !response.redirected) event.waitUntil(cache.put(request.url.split('#')[0], response.clone()));
        return response;
      } catch {
        const key = request.url.split('#')[0].split('?')[0];
        return (await cache.match(key)) ?? (await cache.match(pages[0])) ?? Response.error();
      }
    })());
    return;
  }

  if (url.pathname.includes('/_next/static/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    })());
  }
});
