import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5L6 33.8C9.4 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37 38.9 44 33.7 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

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

function EldroPlusMark() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M30 6C30 6 18 18 18 28C18 35 24 41 30 41C36 41 42 35 42 28C42 18 30 6 30 6Z" fill="white"/>
      <path d="M30 39C30 39 13 35 9 22C16 17 27 26 30 39Z" fill="white" opacity="0.8"/>
      <path d="M30 39C30 39 47 35 51 22C44 17 33 26 30 39Z" fill="white" opacity="0.8"/>
      <path d="M30 41L30 52" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M23 50C20 47 20 43 24 42C27 45 27 51 23 50Z" fill="white" opacity="0.6"/>
      <path d="M37 50C40 47 40 43 36 42C33 45 33 51 37 50Z" fill="white" opacity="0.6"/>
    </svg>
  );
}

function BrandPanel() {
  const features = [
    {
      icon: (
        <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: '30-Day Wellness Challenge'
    },
    {
      icon: (
        <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Daily Health Tasks'
    },
    {
      icon: (
        <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Track Your Progress'
    },
  ];
  return (
    <div className="relative h-full flex flex-col items-center justify-center px-10 py-12 overflow-hidden select-none">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-black/10 blur-sm pointer-events-none" />
      <div className="absolute top-1/3 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative w-28 h-28 rounded-[28px] flex items-center justify-center p-5 mb-7"
        style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', backdropFilter:'blur(8px)' }}>
        <EldroPlusMark />
      </div>
      <h1 className="font-display font-black text-5xl text-white tracking-tight leading-none">
        Eldro<span style={{ color: '#FFB394' }}>+</span>
      </h1>
      <p className="text-[11px] font-semibold tracking-[0.24em] mt-3 mb-10 uppercase"
         style={{ color: 'rgba(255,255,255,0.50)' }}>
        Live Healthy · Better Tomorrow
      </p>
      <div className="w-full space-y-3 max-w-[220px]">
        {features.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)' }}>
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <span className="text-white/85 text-xs font-medium leading-snug">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputBase = { background: '#FAFAFA', border: '1.5px solid #EAECF0', fontSize: '15px' };
function applyFocus(e) {
  e.target.style.borderColor = '#E84C1E';
  e.target.style.boxShadow = '0 0 0 4px rgba(232,76,30,0.10)';
  e.target.style.background = '#FFFFFF';
}
function applyBlur(e) {
  e.target.style.borderColor = '#EAECF0';
  e.target.style.boxShadow = 'none';
  e.target.style.background = '#FAFAFA';
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
      const { user, token } = await api.post('/api/auth/login', { phone: identifier, password });
      setUser(user, token);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'Incorrect phone number or password' : err.message);
    } finally { setLoading(false); }
  }

  const errorBanner = error && (
    <div className="flex items-center gap-2 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 mb-3 md:mb-4 text-xs md:text-sm text-red-600"
         style={{ background: '#FFF0F0', border: '1px solid #FFD0D0' }}>
      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      {error}
    </div>
  );

  const formBody = (
    <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
      {/* Phone Number Input */}
      <div className="relative">
        <span className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2" style={{ color: '#B8C0CC' }}>
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
          className="w-full rounded-xl md:rounded-2xl px-4 py-3 md:py-4 pl-10 md:pl-12 text-gray-900 transition-all duration-200 focus:outline-none"
          style={inputBase}
          onFocus={applyFocus}
          onBlur={applyBlur}
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <span className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2" style={{ color: '#B8C0CC' }}>
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
          className="w-full rounded-xl md:rounded-2xl px-4 py-3 md:py-4 pl-10 md:pl-12 pr-11 text-gray-900 transition-all duration-200 focus:outline-none"
          style={inputBase}
          onFocus={applyFocus}
          onBlur={applyBlur}
        />
        <button type="button" onClick={() => setShowPwd((v) => !v)}
          className="absolute right-3.5 md:right-4 top-1/2 -translate-y-1/2" style={{ color: '#B8C0CC' }}>
          <EyeIcon open={showPwd} />
        </button>
      </div>

      {/* Forgot */}
      <div className="text-right" style={{ marginTop: '-4px' }}>
        <button type="button" className="text-xs md:text-sm font-semibold" style={{ color: '#E84C1E' }}>
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-display font-bold text-white text-sm md:text-[15px] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background:'linear-gradient(135deg, #E84C1E 0%, #C83A0E 100%)', boxShadow:'0 4px 18px rgba(232,76,30,0.38)' }}>
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
      {/* MOBILE */}
      <div
        className="md:hidden h-[100dvh] flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #7A1E04 0%, #C83A0E 55%, #E84C1E 100%)' }}
      >
        <div className="flex flex-col items-center text-center px-5 pt-12 pb-5 shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 pointer-events-none -z-0" />
          <div className="relative w-12 h-12 rounded-[15px] flex items-center justify-center p-2.5 mb-3"
            style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', backdropFilter:'blur(8px)', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
            <EldroPlusMark />
          </div>
          <h1 className="font-display font-black text-[1.85rem] text-white tracking-tight leading-none">
            Eldro<span style={{ color: '#FFB394' }}>+</span>
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.22em] mt-1.5 uppercase"
             style={{ color: 'rgba(255,255,255,0.55)' }}>
            Live Healthy · Better Tomorrow
          </p>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-t-[1.75rem] overflow-y-auto px-5 pt-5 pb-5">
          <h2 className="font-display font-extrabold text-xl text-gray-900 mb-0.5">Welcome back</h2>
          <p className="text-xs mb-3" style={{ color: '#98A2B3' }}>Sign in to continue your journey</p>
          {errorBanner}
          {formBody}
        </div>
      </div>

      {/* DESKTOP / TABLET */}
      <div className="hidden md:flex min-h-[100dvh] items-center justify-center p-8"
           style={{ background: 'linear-gradient(135deg, #7A1E04 0%, #C83A0E 55%, #E84C1E 100%)' }}>
        <div className="w-full"
          style={{ maxWidth:'960px', background:'white', borderRadius:'2.8rem', padding:'14px',
                   boxShadow:'0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.07)' }}>
          <div className="flex overflow-hidden"
            style={{ borderRadius:'2.1rem', background:'linear-gradient(155deg, #7A1E04 0%, #B82E0A 45%, #E84C1E 100%)', minHeight:'600px' }}>
            <div className="w-[44%] shrink-0"><BrandPanel /></div>
            <div className="flex-1 flex items-stretch py-4 pr-4">
              <div className="bg-white w-full flex flex-col justify-center px-9 py-8 overflow-y-auto"
                style={{ borderRadius:'1.6rem', boxShadow:'0 4px 30px rgba(0,0,0,0.10)' }}>
                <h2 className="font-display font-extrabold text-[1.65rem] text-gray-900 mb-0.5">
                  Welcome back
                </h2>
                <p className="text-sm mb-6" style={{ color: '#98A2B3' }}>
                  Sign in to continue your journey
                </p>
                {errorBanner}
                {formBody}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
