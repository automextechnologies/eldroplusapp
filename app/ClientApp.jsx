'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AppWithRouter = dynamic(
  () =>
    import('react-router-dom').then((rrd) => {
      const { BrowserRouter } = rrd;
      return import('../src/App').then((mod) => {
        const App = mod.default;
        return function DynamicApp() {
          return (
            <BrowserRouter>
              <App />
            </BrowserRouter>
          );
        };
      });
    }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function ClientApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[PWA] Service worker registered:', reg.scope))
        .catch((err) => console.warn('[PWA] Service worker registration failed:', err));
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <AppWithRouter />;
}
