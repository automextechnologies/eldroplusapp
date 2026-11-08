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
    <div className="fixed bottom-20 left-4 right-4 bg-[#1D1D1F]/95 backdrop-blur-xl border border-white/10 text-white rounded-[22px] p-4 z-40 shadow-2xl animate-scale-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#00A86B]/20 border border-[#00A86B]/30 rounded-xl flex items-center justify-center flex-shrink-0 text-[#00A86B]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-sm tracking-tight">Add to Home Screen</p>
          {isIOS ? (
            <p className="text-gray-300 text-xs mt-1">
              Tap the share button <span className="text-white">⬆</span> then "Add to Home Screen" to install eldroplus.
            </p>
          ) : (
            <p className="text-gray-300 text-xs mt-1">Install for a faster, offline-ready native app experience.</p>
          )}
        </div>
        <button onClick={() => { setDismissed(true); setShowBanner(false); }} className="text-gray-400 hover:text-white p-1 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {!isIOS && deferredPrompt && (
        <button onClick={handleInstall} className="mt-3 w-full py-2.5 bg-[#00A86B] hover:bg-[#00915C] text-white rounded-full text-xs font-semibold shadow-sm transition-all">
          Install App
        </button>
      )}
    </div>
  );
}
