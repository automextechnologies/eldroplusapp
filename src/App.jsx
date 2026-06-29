import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from './store/useUserStore';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyTasks from './pages/DailyTasks';
import ChallengeGrid from './pages/ChallengeGrid';
import DayDetail from './pages/DayDetail';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import db from './db/dexie';

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://elderoplusbackend.onrender.com';

function RequireAuth({ children }) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)();
  const user = useUserStore((s) => s.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function RequireGuest({ children }) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)();
  const user = useUserStore((s) => s.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const token = useUserStore((s) => s.token);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      window.dispatchEvent(new Event('pwa-installable'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'REPLAY_SYNC_QUEUE') replaySyncQueue();
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function replaySyncQueue() {
    const queue = await db.syncQueue.toArray();
    for (const item of queue) {
      try {
        const url = item.endpoint.startsWith('http') ? item.endpoint : `${BASE_URL}${item.endpoint}`;
        await fetch(url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(item.body),
        });
        await db.syncQueue.delete(item.id);
      } catch { break; }
    }
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"  element={<RequireGuest><Login /></RequireGuest>} />

      {/* Admin */}
      <Route path="/admin"  element={<RequireAdmin><Admin /></RequireAdmin>} />

      {/* App */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index         element={<Dashboard />} />
        <Route path="tasks"          element={<DailyTasks />} />
        <Route path="challenge"      element={<ChallengeGrid />} />
        <Route path="day/:dayNumber" element={<DayDetail />} />
        <Route path="settings"       element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
