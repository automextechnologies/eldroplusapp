import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useStreak } from '../hooks/useStreak';
import { isDayUnlocked } from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function StatCard({ icon, label, value, colorClass, borderColor }) {
  return (
    <div className={`flex-1 bg-white rounded-2xl px-4 py-3.5 border ${borderColor} flex flex-col justify-between transition-all duration-300 hover:border-brand-500/20 active:scale-[0.98] shadow-sm`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass} bg-gray-50`}>
          {icon}
        </div>
        <p className={`font-mono font-extrabold text-[15px] leading-none ${colorClass}`}>{value || '—'}</p>
      </div>
      <p className="text-[9px] text-gray-500 font-bold mt-2.5 tracking-wide uppercase leading-none">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const streak = useStreak(currentDayNumber);

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.deferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!user || !allLogs) return null;

  const isChallengeStarted = user.startDate ? isDayUnlocked(1, user.startDate) : true;

  // Filter logs for today
  const todayDateString = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = allLogs.filter((l) => l.date === todayDateString);
  const todayLogMap = {};
  todayLogs.forEach((l) => {
    todayLogMap[l.taskId] = l;
  });

  const completedTodayCount = TASK_ORDER.filter((t) => {
    const log = todayLogMap[t];
    return isTaskCompleted(t, log, currentDayNumber, currentDayNumber);
  }).length;

  const todayProgressPercent = (completedTodayCount / 5) * 100;

  // Stats calculation over allLogs
  function getCumStat(taskId, avg = false) {
    const items = allLogs.filter((l) => l.taskId === taskId && l.amount > 0);
    if (!items.length) return null;
    const total = items.reduce((s, l) => s + l.amount, 0);
    return avg ? +(total / items.length).toFixed(1) : total;
  }

  const totalWater = getCumStat('water');
  const totalYoga = getCumStat('yoga');
  const avgSleep = getCumStat('sleep', true);
  const totalProtein = getCumStat('protein');

  // Days completed (all 5 tasks completed)
  let completedDaysCount = 0;
  for (let d = 1; d <= 30; d++) {
    const dayLogs = allLogs.filter((l) => l.dayNumber === d);
    const allDone = TASK_ORDER.every((taskId) => {
      const log = dayLogs.find((l) => l.taskId === taskId);
      return isTaskCompleted(taskId, log, d, currentDayNumber);
    });
    if (allDone) completedDaysCount++;
  }

  // Chart data formatting
  const completedLogs = allLogs.filter((l) => l.completed || l.amount > 0);
  const maxChartDays = Math.max(currentDayNumber, 5);

  const getChartData = (taskId) => {
    return Array.from({ length: maxChartDays }, (_, i) => {
      const dNum = i + 1;
      const log = completedLogs.find((l) => l.taskId === taskId && l.dayNumber === dNum);
      return {
        day: `D${dNum}`,
        val: log ? log.amount : 0
      };
    });
  };

  const sleepData = getChartData('sleep');
  const waterData = getChartData('water');
  const yogaData = getChartData('yoga');
  const proteinData = getChartData('protein');

  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-md">
          <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">{label}</p>
          <p className="text-xs font-mono font-extrabold text-gray-900">
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-12">
      {/* PWA / Header Topbar */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-white/60 backdrop-blur-md">
        <div>
          <span className="text-xs font-bold text-gray-500">{greeting},</span>
          <h2 className="text-sm font-display font-black text-gray-900">{firstName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {user.batchName && (
            <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase">
              {user.batchName}
            </span>
          )}
          <button
            onClick={() => setShowInstallGuide(true)}
            disabled={isInstalled}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[10px] border ${
              isInstalled
                ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-500 text-white border-brand-500 hover:bg-brand-600 active:scale-95'
            }`}
          >
            <span>{isInstalled ? 'Installed' : 'Install'}</span>
          </button>
        </div>
      </header>

      {!isChallengeStarted ? (
        <div className="max-w-md mx-auto px-4 py-12 text-center w-full">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-card">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4 text-orange-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-display font-extrabold text-gray-900 text-lg">Challenge has not started yet</h2>
            <p className="text-sm text-gray-500 mt-2">
              Your 30-day wellness challenge is scheduled to begin on:
            </p>
            <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 font-bold text-sm font-mono">
              {user.startDate ? new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Greeting Hero Card */}
          <div 
            className="rounded-3xl p-6 text-brand-950 relative overflow-hidden shadow-sm border border-brand-500/10"
            style={{ background: 'linear-gradient(135deg, #FFF0EB 0%, #FFE0D6 100%)' }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/20 blur-md pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/5 blur-xl pointer-events-none" />
            
            <div className="relative flex justify-between items-center">
              <div>
                <p className="text-brand-600 text-xs font-extrabold tracking-widest uppercase">Overview</p>
                <h2 className="font-display font-extrabold text-2xl mt-0.5 text-brand-950">Day {currentDayNumber}<span className="text-brand-800/40 font-medium"> / 30</span></h2>
                <p className="text-xs text-brand-700 font-semibold mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-brand-500/10 text-brand-700 border border-brand-500/20 px-3 py-1 rounded-xl text-xs font-bold font-mono">
                  {completedTodayCount} / 5 Logged
                </span>
              </div>
            </div>

            <div className="relative mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-brand-950">
                <span>TODAY'S TASKS PROGRESS</span>
                <span className="font-mono">{Math.round(todayProgressPercent)}%</span>
              </div>
              <div className="h-2.5 bg-brand-500/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(232,76,30,0.15)]"
                  style={{ width: `${todayProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* CTA Link to Workspace */}
          <Link 
            to="/tasks" 
            className="block relative overflow-hidden rounded-3xl p-6 border border-brand-500/15 bg-gradient-to-r from-brand-50 to-white hover:border-brand-500/30 transition-all active:scale-[0.99] shadow-sm group"
          >
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-brand transition-transform group-hover:translate-x-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <h3 className="font-display font-black text-base text-gray-900">Log Today's Tasks</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[80%]">Open your 30-day timeline roadmap workspace and complete your daily checklist.</p>
          </Link>

          {/* Streaks & Cumulative Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Streak & Completion Cards */}
            <div className="md:col-span-1 premium-card p-4 flex flex-col justify-center gap-3">
              <div className="flex items-center gap-3">
                <div className="text-brand-500">
                  <svg className="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(232,76,30,0.1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-extrabold text-xl text-gray-900 leading-none">{streak}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Day Streak</p>
                </div>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center gap-3">
                <div className="text-emerald-500">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-extrabold text-xl text-gray-900 leading-none">{completedDaysCount}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Days Done</p>
                </div>
              </div>
            </div>

            {/* Total Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <StatCard icon={TASK_CONFIG.yoga.icon} label="Yoga Total" value={totalYoga ? `${totalYoga}m` : null} colorClass="text-emerald-500" borderColor="border-emerald-500/10" />
              <StatCard icon={TASK_CONFIG.water.icon} label="Water Total" value={totalWater ? totalWater >= 1000 ? `${(totalWater/1000).toFixed(1)}L` : `${totalWater}ml` : null} colorClass="text-cyan-500" borderColor="border-cyan-500/10" />
              <StatCard icon={TASK_CONFIG.protein.icon} label="Protein Total" value={totalProtein ? `${totalProtein}g` : null} colorClass="text-amber-600" borderColor="border-amber-500/10" />
              <StatCard icon={TASK_CONFIG.sleep.icon} label="Avg Sleep" value={avgSleep ? `${avgSleep}h` : null} colorClass="text-indigo-500" borderColor="border-indigo-500/10" />
            </div>
          </div>

          {/* Performance Trends Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Performance Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water Intake Chart */}
              <div className="premium-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.water.icon} Water Trend
                  </span>
                  <span className="text-xs font-bold text-gray-400">Target: 2.5L</span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={waterData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cWater" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis tickFormatter={(val) => val >= 1000 ? `${val/1000}L` : val} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip unit="ml" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#cWater)" dot={{ r: 2.5, stroke: '#06b6d4', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sleep Duration Chart */}
              <div className="premium-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.sleep.icon} Sleep Trend
                  </span>
                  <span className="text-xs font-bold text-gray-400">Target: 7-9h</span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis tickFormatter={(val) => `${val}h`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip unit="hrs" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#cSleep)" dot={{ r: 2.5, stroke: '#6366f1', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Protein Intake Chart */}
              <div className="premium-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.protein.icon} Protein Trend
                  </span>
                  <span className="text-xs font-bold text-gray-400">Target: 60g</span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={proteinData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cProtein" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis tickFormatter={(val) => `${val}g`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip unit="g" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#cProtein)" dot={{ r: 2.5, stroke: '#ea580c', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Yoga Intake Chart */}
              <div className="premium-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.yoga.icon} Yoga Trend
                  </span>
                  <span className="text-xs font-bold text-gray-400">Target: 15-60m</span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yogaData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cYoga" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#cYoga)" dot={{ r: 2.5, stroke: '#10b981', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PWA Install Guide Modal ── */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mt-2">
              <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4 text-brand-500">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h2 className="font-display font-extrabold text-lg text-gray-900">Install Eldro+ App</h2>
              <p className="text-xs text-gray-500 mt-1">Save this health challenge to your home screen for quick daily check-ins.</p>

              {!isInstalled && deferredPrompt && (
                <button
                  onClick={async () => {
                     if (!deferredPrompt) return;
                     deferredPrompt.prompt();
                     const { outcome } = await deferredPrompt.userChoice;
                     if (outcome === 'accepted') {
                       window.deferredPrompt = null;
                       setDeferredPrompt(null);
                       setIsInstalled(true);
                       setShowInstallGuide(false);
                     }
                  }}
                  className="mt-5 w-full bg-gradient-to-r from-orange-600 to-[#E84C1E] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  Install App
                </button>
              )}

              <div className="mt-5 text-left border-t border-gray-100 pt-4 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Install Instructions</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tap your browser menu (Share or three dots) and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
