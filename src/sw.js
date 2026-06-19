import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// API routes: NetworkFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
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
