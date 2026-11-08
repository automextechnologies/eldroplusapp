// Service Worker for eldroplus PWA
const CACHE_NAME = 'eldroplus-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/eldropluslogomain.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy for API and page navigations with offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Handle same origin requests and font caches
  if (url.origin === self.location.origin || url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Background sync for offline task logs
self.addEventListener('sync', (event) => {
  if (event.tag === 'task-sync') {
    event.waitUntil(replaySyncQueue());
  }
});

async function replaySyncQueue() {
  const clientList = await clients.matchAll({ type: 'window' });
  for (const client of clientList) {
    client.postMessage({ type: 'REPLAY_SYNC_QUEUE' });
  }
}
