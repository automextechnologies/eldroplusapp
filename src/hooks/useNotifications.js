import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useApi } from './useApi';
import { getToken, onMessage } from 'firebase/messaging';
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
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BLeiYky8D7PTtuLsx07VaGx85q5g1Mp3egtHQePROwnsLsIehzn-zgr0WlXL-TKtvMXXwkq5OQFokv_1w7YMyzc';
      const fcmToken = await getToken(messaging, {
        vapidKey,
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

  // Listen for foreground FCM notifications
  useEffect(() => {
    if (!messaging) return;
    try {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Received foreground notification:', payload);
        const title = payload.notification?.title || payload.data?.title || 'eldroplus';
        const body = payload.notification?.body || payload.data?.body || '';
        const icon = payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png';
        const data = payload.data || { url: '/' };

        if (Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon,
                badge: '/badge-72x72.png',
                tag: payload.data?.tag || `foreground-${Date.now()}`,
                data,
              });
            }).catch(() => {
              new Notification(title, { body, icon });
            });
          } else {
            new Notification(title, { body, icon });
          }
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('[FCM] onMessage listener setup error:', err);
    }
  }, []);

  async function requestPermission() {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }

  function cancelTaskReminders(taskId) {
    // No-op (handled server-side via FCM)
  }

  return { permission, supported, isIOS, isStandalone, requestPermission, cancelTaskReminders };
}
