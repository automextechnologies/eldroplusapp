import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// API routes: NetworkFirst
registerRoute(
  ({ url }) => url.origin === 'https://elderoplusbackend.onrender.com' || url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 8,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Google Fonts: CacheFirst
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 31536000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Local reminder scheduling via setTimeout
const scheduledTimers = new Map();

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDERS') {
    scheduledTimers.forEach((id) => clearTimeout(id));
    scheduledTimers.clear();

    for (const reminder of event.data.reminders) {
      if (reminder.delayMs <= 0) continue;
      const timerId = setTimeout(() => {
        self.registration.showNotification('30-Day Health Challenge', {
          body: reminder.msg,
          icon: '/pwa-192x192.png',
          badge: '/badge-72x72.png',
          tag: `${reminder.taskId}-${reminder.hour}-local`,
          data: { url: '/', taskId: reminder.taskId },
        });
      }, reminder.delayMs);

      scheduledTimers.set(`${reminder.taskId}-${reminder.hour}`, timerId);
    }
  }

  if (event.data?.type === 'TASK_COMPLETED') {
    const { taskId } = event.data;
    if (taskId !== 'sleep') {
      scheduledTimers.forEach((timerId, key) => {
        if (key.startsWith(taskId)) {
          clearTimeout(timerId);
          scheduledTimers.delete(key);
        }
      });
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Background sync for offline task logs
self.addEventListener('sync', (event) => {
  if (event.tag === 'task-sync') {
    event.waitUntil(replaySyncQueue());
  }
});

async function replaySyncQueue() {
  // Open Dexie from SW context is complex; instead we just send a message to clients
  const clientList = await clients.matchAll({ type: 'window' });
  for (const client of clientList) {
    client.postMessage({ type: 'REPLAY_SYNC_QUEUE' });
  }
}
// Import Firebase scripts from CDN
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC--w_4Zx7ozuhhrHn9TuLQ6QjU6peGHPg",
  authDomain: "eldroplus.firebaseapp.com",
  projectId: "eldroplus",
  storageBucket: "eldroplus.firebasestorage.app",
  messagingSenderId: "1011847414777",
  appId: "1:1011847414777:web:2aefd0b666abab48b7f328"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Water Intake Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Time to drink water! Keep your hydration target on track.',
    icon: payload.notification?.icon || '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'water-intake-reminder',
    data: payload.data || { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
