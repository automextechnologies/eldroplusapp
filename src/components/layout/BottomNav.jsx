import { NavLink } from 'react-router-dom';

const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-200 ${a ? 'text-brand-500' : 'text-gray-400'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={a
          ? 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z'
          : 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'}
        />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Workspace',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-200 ${a ? 'text-brand-500' : 'text-gray-400'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={a
          ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
          : 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3'}
        />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profile',
    icon: (a) => (
      <svg className={`w-6 h-6 transition-all duration-200 ${a ? 'text-brand-500' : 'text-gray-400'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={a
          ? 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          : 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'}
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xl border border-gray-200 z-30 rounded-3xl shadow-lg py-1 px-2">
      <div className="max-w-md mx-auto flex justify-around">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="nav-item"
          >
            {({ isActive }) => (
              <>
                <div className={`relative p-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-brand-50' : ''}`}>
                  {icon(isActive)}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_#E84C1E]" />
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors duration-150 ${isActive ? 'text-brand-500' : 'text-gray-400'}`}>
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
