import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

export default function AdminSidebar({
  activeTab = 'dashboard',
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen,
  customerCount = null,
  activeBatchesCount = null,
  openTicketsCount = null,
}) {
  const navigate = useNavigate();
  const { logout, user: adminUser } = useUserStore();

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  const navGroups = [
    {
      group: 'Overview & Clients',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          badge: null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
            </svg>
          ),
        },
        {
          id: 'customers',
          label: 'Customers Directory',
          badge: typeof customerCount === 'number' && customerCount > 0 ? (
            <span className="ml-auto text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
              {customerCount}
            </span>
          ) : null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          id: 'onboarding',
          label: 'Customer Onboarding',
          badge: null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'Programs & Content',
      items: [
        {
          id: 'batches',
          label: 'Batches Management',
          badge: typeof activeBatchesCount === 'number' && activeBatchesCount > 0 ? (
            <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
              {activeBatchesCount} active
            </span>
          ) : null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="12" cy="15" r="2" />
            </svg>
          ),
        },
        {
          id: 'meetings',
          label: 'Live Meetings',
          badge: null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="14" height="12" rx="3" />
              <path d="m16 10 5-3.5v11l-5-3.5v-4z" />
            </svg>
          ),
        },
        {
          id: 'recorded-video',
          label: 'Recorded Videos',
          badge: null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
              <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" fillOpacity={0.25} />
            </svg>
          ),
        },
        {
          id: 'packages',
          label: 'Packages Management',
          badge: null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'CRM & Engagement',
      items: [
        {
          id: 'tickets',
          label: 'Enquiry Tickets',
          badge: typeof openTicketsCount === 'number' && openTicketsCount > 0 ? (
            <span className="ml-auto text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
              {openTicketsCount}
            </span>
          ) : null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M9 5v14" strokeDasharray="2 2" />
            </svg>
          ),
        },
        {
          id: 'salesreps',
          label: 'Sales Reps (Telecallers)',
          badge: null,
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar for Desktop & drawer for Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-68 md:w-64 lg:w-68 bg-[#F5F5F7]/90 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static md:h-screen shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/eldropluslogomain.png"
              alt="eldroplus"
              className="w-8 h-8 object-contain rounded-[9px] shadow-sm bg-white p-0.5 border border-black/[0.06] shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-[15px] text-[#1D1D1F] tracking-tight leading-none truncate">
                eldroplus CRM
              </h1>
              <span className="text-[10px] tracking-wider text-[#86868B] font-semibold uppercase mt-1 block truncate">
                Control Panel
              </span>
            </div>
          </div>
          {setIsMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close Menu"
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg md:hidden transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sidebar Navigation: Organized into Logical Sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 pt-2 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                  {group.group}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/admin/${item.id}`);
                        if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-[10px] text-[13px] font-medium flex items-center gap-2.5 transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-black/[0.06] text-[#1D1D1F] font-semibold shadow-2xs'
                          : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.03]'
                      }`}
                    >
                      <span className={isActive ? 'text-[#00A86B]' : 'text-[#86868B]'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-3.5 sm:p-4 border-t border-black/[0.04] bg-white/40 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#00A86B]/10 text-[#00A86B] font-display font-semibold text-xs flex items-center justify-center shrink-0 border border-[#00A86B]/20 shadow-2xs">
                {(adminUser?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1D1D1F] truncate leading-tight">
                  {adminUser?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-[#86868B] font-medium truncate mt-0.5">Admin Role</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 text-xs font-medium text-[#FF3B30] hover:text-[#FF3B30] bg-[#FF3B30]/[0.08] hover:bg-[#FF3B30]/[0.12] rounded-[10px] transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && setIsMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}
    </>
  );
}
