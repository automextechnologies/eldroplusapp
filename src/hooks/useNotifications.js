import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const token = useUserStore((s) => s.token);

  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const supported = 'Notification' in window && 'serviceWorker' in navigator;

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

  async function requestPermission() {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }

  useEffect(() => {
    if (permission !== 'granted' || !token) return;

    // 1. 15-second test notification
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

    // 2. 2-hour water intake notification checker
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
    // No-op (previously cleared scheduled task reminders)
  }

  return { permission, supported, isIOS, isStandalone, requestPermission, cancelTaskReminders };
}
