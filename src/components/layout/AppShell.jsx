import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import InstallPrompt from '../shared/InstallPrompt';
import { useUserStore } from '../../store/useUserStore';
import { useNotifications } from '../../hooks/useNotifications';

export default function AppShell() {
  const user = useUserStore((s) => s.user);
  const { permission, requestPermission } = useNotifications();

  const isCustomer = user?.role === 'customer';

  if (isCustomer && permission !== 'granted') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-border p-8 shadow-xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 animate-bounce">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          
          <h2 className="text-xl font-display font-extrabold text-gray-900">Enable Notifications</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            To start the challenge and keep your health on track, Eldro+ requires notification access to send your daily water intake reminders.
          </p>

          {permission === 'denied' ? (
            <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 flex flex-col gap-1 text-left">
              <span className="font-bold">Notifications Blocked:</span>
              <span>Please go to your browser/site settings and set notifications permission to "Allow" to continue.</span>
            </div>
          ) : (
            <button
              onClick={requestPermission}
              className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-brand hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              Allow Notifications
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full max-w-5xl mx-auto md:px-6 py-0 md:py-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
