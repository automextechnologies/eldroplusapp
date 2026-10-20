// Scripts for Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyC--w_4Zx7ozuhhrHn9TuLQ6QjU6peGHPg",
  authDomain: "eldroplus.firebaseapp.com",
  projectId: "eldroplus",
  storageBucket: "eldroplus.firebasestorage.app",
  messagingSenderId: "1011847414777",
  appId: "1:1011847414777:web:4d2d28281d7670d0b7f328"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'eldroplus';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new health update.',
    icon: payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.tag || `eldroplus-push-${Date.now()}`,
    data: payload.data || { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && url && url !== '/') {
            client.navigate(url);
          }
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
