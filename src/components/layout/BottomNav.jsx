import { NavLink } from 'react-router-dom';

const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-150 ${a ? 'text-[#00A86B]' : 'text-[#8E8E93]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="2.2" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.2 : 0} />
        <rect x="14" y="3" width="7" height="7" rx="2.2" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.2 : 0} />
        <rect x="3" y="14" width="7" height="7" rx="2.2" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.2 : 0} />
        <rect x="14" y="14" width="7" height="7" rx="2.2" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.2 : 0} />
      </svg>
    ),
  },
  {
    to: '/tutorials',
    label: 'Tutorials',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-150 ${a ? 'text-[#00A86B]' : 'text-[#8E8E93]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.15 : 0} />
        <polygon points="10 9 16 12 10 15 10 9" fill={a ? 'currentColor' : 'none'} />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-150 ${a ? 'text-[#00A86B]' : 'text-[#8E8E93]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.15 : 0} />
        <path d="m8.5 12 2.5 2.5 5-5" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profile',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-150 ${a ? 'text-[#00A86B]' : 'text-[#8E8E93]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.75" fill={a ? 'currentColor' : 'none'} fillOpacity={a ? 0.2 : 0} />
        <path d="M4.5 19.5c0-3.5 3.5-5.5 7.5-5.5s7.5 2 7.5 5.5" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/85 backdrop-blur-2xl border border-black/[0.08] z-30 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.12)] py-1.5 px-3">
      <div className="max-w-md mx-auto flex justify-around">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="nav-item select-none"
          >
            {({ isActive }) => (
              <>
                <div className={`relative p-1.5 rounded-full transition-all duration-150 ${isActive ? 'bg-[#00A86B]/12' : ''}`}>
                  {icon(isActive)}
                </div>
                <span className={`text-[10px] tracking-tight transition-colors duration-150 ${isActive ? 'font-semibold text-[#00A86B]' : 'font-medium text-[#8E8E93]'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
