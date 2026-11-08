import { NavLink } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-[#00A86B]' : 'text-[#86868B]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="2" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
        <rect x="14" y="3" width="7" height="7" rx="2" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
        <rect x="3" y="14" width="7" height="7" rx="2" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
        <rect x="14" y="14" width="7" height="7" rx="2" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
      </svg>
    ),
  },
  {
    to: '/tutorials',
    label: 'Tutorials',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-[#00A86B]' : 'text-[#86868B]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.15 : 0} />
        <polygon points="10 9 16 12 10 15 10 9" fill={isActive ? 'currentColor' : 'none'} />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-[#00A86B]' : 'text-[#86868B]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.15 : 0} />
        <path d="m8.5 12 2.5 2.5 5-5" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profile & Settings',
    icon: (isActive) => (
      <svg className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-[#00A86B]' : 'text-[#86868B]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.75" fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
        <path d="M4.5 19.5c0-3.5 3.5-5.5 7.5-5.5s7.5 2 7.5 5.5" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#F5F5F7]/80 backdrop-blur-2xl border-r border-black/[0.06] h-screen sticky top-0 shrink-0 z-40">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-black/[0.04]">
        <img src="/eldropluslogomain.png" alt="eldroplus" className="w-8 h-8 object-contain rounded-[10px] shadow-sm bg-white p-0.5 border border-black/[0.06]" />
        <div>
          <span className="font-display font-bold text-[17px] tracking-tight text-[#1D1D1F]">eldroplus</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] font-display font-medium text-[14px] transition-all duration-150 ${
                isActive
                  ? 'bg-black/[0.06] text-[#1D1D1F] font-semibold shadow-2xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.03]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {icon(isActive)}
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User / Profile Footer */}
      {user && (
        <div className="p-3.5 border-t border-black/[0.04] bg-white/40">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20 flex items-center justify-center font-display font-semibold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#1D1D1F] truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-[#86868B] truncate leading-none mt-0.5">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[#FF3B30] bg-[#FF3B30]/[0.08] hover:bg-[#FF3B30]/[0.12] rounded-[10px] transition-all duration-150 active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
