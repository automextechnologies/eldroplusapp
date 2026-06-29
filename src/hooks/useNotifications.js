import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useApi } from './useApi';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// Initialize Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app;
let messaging;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
} catch (err) {
  console.error('Failed to initialize Firebase SDK:', err);
}

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const token = useUserStore((s) => s.token);
  const api = useApi();

  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const supported = 'Notification' in window && 'serviceWorker' in navigator && !!messaging;

  // Poll for permission status changes (e.g. if the user grants/revokes via site settings)
  useEffect(() => {
    if (!supported) return;
    const interval = setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [permission, supported]);

  async function syncToken() {
    if (!supported || permission !== 'granted' || !token) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const fcmToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: reg,
      });
      if (fcmToken) {
        console.log('[FCM] Successfully fetched token:', fcmToken);
        await api.post('/api/notifications/fcm-subscribe', { token: fcmToken });
      }
    } catch (err) {
      console.warn('[FCM] Token sync failed:', err.message);
    }
  }

  // Sync token whenever permission is granted or user token changes
  useEffect(() => {
    syncToken();
  }, [permission, token]);

  async function requestPermission() {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }

  function cancelTaskReminders(taskId) {
    // No-op (previously cleared scheduled task reminders)
  }

  return { permission, supported, isIOS, isStandalone, requestPermission, cancelTaskReminders };
}
