import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  );
}

function BrandPanel() {
  const features = [
    {
      icon: (
        <svg className="w-4 h-4 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: '30-Day Wellness Challenge'
    },
    {
      icon: (
        <svg className="w-4 h-4 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Daily Health Tasks'
    },
    {
      icon: (
        <svg className="w-4 h-4 text-[#AF52DE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
      label: 'Track Your Progress'
    },
  ];
  return (
    <div className="relative h-full flex flex-col items-center justify-center px-10 py-12 select-none">
      <div className="relative w-24 h-24 rounded-[22px] flex items-center justify-center p-3 mb-6 bg-white shadow-sm border border-black/[0.06]">
        <img src="/eldropluslogomain.png" alt="eldroplus logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="font-display font-bold text-4xl text-[#1D1D1F] tracking-tight leading-none">
        eldroplus
      </h1>
      <p className="text-[11px] font-semibold tracking-widest mt-2.5 mb-8 uppercase text-[#86868B]">
        Live Healthy · Better Tomorrow
      </p>
      <div className="w-full space-y-2.5 max-w-[240px]">
        {features.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 bg-white/70 border border-black/[0.06] shadow-2xs">
            <div className="w-6 h-6 rounded-full bg-black/[0.03] flex items-center justify-center shrink-0">
              {icon}
            </div>
            <span className="text-[#1D1D1F] text-xs font-medium leading-snug">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputBase = { background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '15px', color: '#1D1D1F' };
function applyFocus(e) {
  e.target.style.borderColor = '#00A86B';
  e.target.style.boxShadow = '0 0 0 4px rgba(0, 168, 107, 0.15)';
  e.target.style.background = '#ffffff';
}
function applyBlur(e) {
  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
  e.target.style.boxShadow = 'none';
  e.target.style.background = 'rgba(0, 0, 0, 0.03)';
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const api = useApi();

  async function handleLogin(e) {
    e.preventDefault();
    if (!identifier || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const { user, token } = await api.post('/api/auth/login', {
        phone: identifier.trim(),
        password: password.trim()
      });
      setUser(user, token);
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'Incorrect phone number or password' : err.message);
    } finally { setLoading(false); }
  }

  const errorBanner = error && (
    <div className="flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 mb-4 text-xs text-[#FF3B30] bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 animate-scale-in">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span className="font-medium">{error}</span>
    </div>
  );

  const formBody = (
    <form onSubmit={handleLogin} className="space-y-3.5 md:space-y-4">
      {/* Phone Number Input */}
      <div className="relative">
        <span className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-[#86868B]">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </span>
        <input
          type="tel"
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
          placeholder="Phone Number"
          autoComplete="tel"
          className="w-full rounded-[14px] md:rounded-[16px] px-4 py-3 md:py-3.5 pl-10 md:pl-12 text-[#1D1D1F] placeholder-[#86868B] transition-all duration-200 focus:outline-none"
          style={inputBase}
          onFocus={applyFocus}
          onBlur={applyBlur}
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <span className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-[#86868B]">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </span>
        <input
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-[14px] md:rounded-[16px] px-4 py-3 md:py-3.5 pl-10 md:pl-12 pr-11 text-[#1D1D1F] placeholder-[#86868B] transition-all duration-200 focus:outline-none"
          style={inputBase}
          onFocus={applyFocus}
          onBlur={applyBlur}
        />
        <button type="button" onClick={() => setShowPwd((v) => !v)}
          className="absolute right-3.5 md:right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]">
          <EyeIcon open={showPwd} />
        </button>
      </div>

      <div className="text-right" style={{ marginTop: '-2px' }}>
        <button type="button" className="text-xs md:text-sm font-medium text-[#00A86B] hover:text-[#00915C]">
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-[14px] md:rounded-[16px] font-display font-semibold text-white text-sm md:text-[15px] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-[#00A86B] hover:bg-[#00915C] shadow-[0_2px_8px_rgba(0,168,107,0.25)]">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Sign In
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </span>
        )}
      </button>
    </form>
  );

  return (
    <>
      <div className="md:hidden h-[100dvh] flex flex-col overflow-hidden bg-[#F5F5F7]">
        <div className="flex flex-col items-center text-center px-5 pt-12 pb-6 shrink-0">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center p-2 mb-3 bg-white shadow-sm border border-black/[0.06]">
            <img src="/eldropluslogomain.png" alt="eldroplus logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#1D1D1F] tracking-tight leading-none">
            eldroplus
          </h1>
          <p className="text-[10px] font-semibold tracking-wider mt-1.5 uppercase text-[#86868B]">
            Live Healthy · Better Tomorrow
          </p>
        </div>
        <div className="flex-1 min-h-0 bg-white border-t border-black/[0.06] rounded-t-[28px] overflow-y-auto px-6 pt-6 pb-6 flex flex-col justify-between shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
          <div>
            <h2 className="font-display font-bold text-xl text-[#1D1D1F] tracking-tight mb-0.5">Welcome back</h2>
            <p className="text-xs mb-5 text-[#86868B]">Sign in to continue your journey</p>
            {errorBanner}
            {formBody}
          </div>
          <div className="mt-6 text-center pb-1">
            <span className="inline-block text-[11px] font-medium text-[#86868B] bg-black/[0.03] px-3 py-1 rounded-full">
              v.1.2
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:flex min-h-[100dvh] items-center justify-center p-8 bg-[#F5F5F7]">
        <div className="w-full max-w-[880px] bg-white rounded-[28px] p-3 border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <div className="flex overflow-hidden rounded-[22px] bg-[#F5F5F7]/80 min-h-[560px]">
            <div className="w-[45%] shrink-0 border-r border-black/[0.04]">
              <BrandPanel />
            </div>
            <div className="flex-1 flex items-stretch p-3">
              <div className="bg-white border border-black/[0.06] w-full flex flex-col justify-between px-9 py-8 rounded-[18px] shadow-sm overflow-y-auto">
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#1D1D1F] tracking-tight mb-1">
                    Welcome back
                  </h2>
                  <p className="text-sm mb-6 text-[#86868B]">
                    Sign in to continue your journey
                  </p>
                  {errorBanner}
                  {formBody}
                </div>
                <div className="mt-6 text-center">
                  <span className="inline-block text-xs font-medium text-[#86868B] bg-black/[0.03] px-3 py-1 rounded-full">
                    v.1.2
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
