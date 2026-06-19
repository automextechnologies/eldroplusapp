import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    if (isStandalone || dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isIOS && !isStandalone) {
      const timer = setTimeout(() => setShowBanner(true), 30000);
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler); };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed, isStandalone, isIOS]);

  useEffect(() => {
    if (deferredPrompt) {
      const timer = setTimeout(() => setShowBanner(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  if (isStandalone || !showBanner || dismissed) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShowBanner(false);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gray-900 text-white rounded-2xl p-4 z-40 shadow-xl animate-scale-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🏋️</span>
        </div>
        <div className="flex-1">
          <p className="font-display font-700 text-sm">Add to Home Screen</p>
          {isIOS ? (
            <p className="text-gray-300 text-xs mt-1">
              Tap the share button <span className="text-white">⬆</span> then "Add to Home Screen" to get push notifications.
            </p>
          ) : (
            <p className="text-gray-300 text-xs mt-1">Install for a better experience & push notifications.</p>
          )}
        </div>
        <button onClick={() => { setDismissed(true); setShowBanner(false); }} className="text-gray-400 p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {!isIOS && deferredPrompt && (
        <button onClick={handleInstall} className="mt-3 w-full py-2 bg-primary rounded-xl text-sm font-medium">
          Install App
        </button>
      )}
    </div>
  );
}
