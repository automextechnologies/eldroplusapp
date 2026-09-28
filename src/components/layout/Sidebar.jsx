import { NavLink } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-brand-900' : 'text-white/80'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={isActive
          ? 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z'
          : 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'}
        />
      </svg>
    ),
  },
  {
    to: '/tutorials',
    label: 'Tutorials',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-brand-900' : 'text-white/80'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={isActive
          ? 'M4 6a2 2 0 00-2 2v8a2 2 0 002 2h9a2 2 0 002-2v-1.172l3.553 1.776A1 1 0 0020 17.714V6.286a1 1 0 00-1.447-.894L15 7.172V6a2 2 0 00-2-2H4z'
          : 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'}
        />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-brand-900' : 'text-white/80'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={isActive
          ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
          : 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3'}
        />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profile & Settings',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-brand-900' : 'text-white/80'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={isActive
          ? 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          : 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'}
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-brand-500 text-white border-r border-brand-400/50 h-screen sticky top-0 shrink-0 z-40 shadow-brand">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-brand-400/40">
        <img src="/eldropluslogomain.png" alt="eldroplus" className="w-8 h-8 object-contain rounded-lg bg-white/20 p-0.5" />
        <div>
          <span className="font-display font-extrabold text-lg tracking-tight text-white">eldroplus</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-display font-bold text-[15px] transition-all duration-200 ${
                isActive
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {icon(isActive)}
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-700 shadow-[0_0_8px_#587363]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User / Profile Footer */}
      {user && (
        <div className="p-4 border-t border-brand-400/40 bg-brand-600/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-display font-bold text-white text-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate leading-snug">{user.name}</p>
              <p className="text-xs text-white/70 truncate leading-none mt-0.5">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-black/20 hover:bg-black/30 rounded-xl transition-colors border border-white/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
