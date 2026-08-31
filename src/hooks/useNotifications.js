import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useApi } from './useApi';
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';

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
