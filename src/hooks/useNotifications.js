import { useEffect, useState } from 'react';
import { useApi } from './useApi';
import { useUserStore } from '../store/useUserStore';

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const api = useApi();
  const token = useUserStore((s) => s.token);

  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  async function requestPermission() {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribe();
    }
    return result === 'granted';
  }

  async function subscribe() {
    if (!token) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });
      await api.post('/api/notifications/subscribe', { subscription: sub.toJSON() });
    } catch (err) {
      console.warn('Push subscribe failed:', err.message);
    }
  }

  async function scheduleToday() {
    if (!token || permission !== 'granted') return;
    try {
      const data = await api.post('/api/notifications/schedule-today');
      if (data.futureReminders?.length > 0 && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({
            type: 'SCHEDULE_REMINDERS',
            reminders: data.futureReminders,
          });
        }
      }
    } catch (e) {
      console.warn('Notification scheduling skipped:', e.message);
    }
  }

  useEffect(() => {
    if (permission !== 'granted' || !token) return;

    // 15-second test notification
    const testInterval = setInterval(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('Eldro+ Water Test', {
            body: 'This is a test notification running every 15 seconds.',
            icon: '/pwa-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'water-test-15s',
            data: { url: '/' }
          });
        } catch (err) {
          console.error('Failed to send local test notification:', err);
        }
      }
    }, 15000);

    // 2-hour water intake notification checker
    // Check every 10 seconds if 2 hours have passed since the last water notification
    const waterInterval = setInterval(async () => {
      const lastNotif = localStorage.getItem('last_water_notification_time');
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      
      if (!lastNotif) {
        // Initialize last notification time to now so it doesn't fire immediately on login
        localStorage.setItem('last_water_notification_time', now.toString());
        return;
      }

      if (now - Number(lastNotif) >= twoHours) {
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification('Water Intake Reminder', {
              body: 'Time to drink water! Keep your hydration target on track.',
              icon: '/pwa-192x192.png',
              badge: '/badge-72x72.png',
              tag: 'water-intake-reminder',
              data: { url: '/' }
            });
            localStorage.setItem('last_water_notification_time', now.toString());
          } catch (err) {
            console.error('Failed to send water intake notification:', err);
          }
        }
      }
    }, 10000);

    return () => {
      clearInterval(testInterval);
      clearInterval(waterInterval);
    };
  }, [permission, token]);

  function cancelTaskReminders(taskId) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({ type: 'TASK_COMPLETED', taskId });
        }
      });
    }
  }

  return { permission, supported, isIOS, isStandalone, requestPermission, scheduleToday, cancelTaskReminders };
}

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array();
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
