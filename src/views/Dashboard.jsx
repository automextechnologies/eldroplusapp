import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useStreak } from '../hooks/useStreak';
import { useApi } from '../hooks/useApi';
import { isDayUnlocked, formatDate } from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import TaskCard from '../components/shared/TaskCard';
import LiveSessionCard from '../components/dashboard/LiveSessionCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div className="flex-1 bg-white rounded-[18px] p-3.5 border border-black/[0.06] shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md active:scale-[0.98]">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass} bg-black/[0.03]`}>
          {icon}
        </div>
        <p className={`font-mono font-bold text-[15px] leading-none ${colorClass}`}>{value || '—'}</p>
      </div>
      <p className="text-[10px] text-[#86868B] font-semibold mt-2.5 tracking-wider uppercase leading-none">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const totalDays = useUserStore((s) => s.getTotalDays)();
  const streak = useStreak(currentDayNumber);
  const api = useApi();

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  async function handleLogSubmit(taskId, data) {
    setLoadingTaskId(taskId);
    try {
      const targetDate = formatDate(new Date());
      let completed = true;
      if (taskId === 'water' || taskId === 'protein') {
        completed = Number(data.amount) > 0;
      }

      const logData = {
        date: targetDate,
        dayNumber: currentDayNumber,
        taskId,
        amount: data.amount || 0,
        completed,
        timestamp: new Date().toISOString(),
      };

      await db.taskLogs.put(logData);

      try {
        await api.post('/api/tasks/log', logData);
      } catch {
        await db.syncQueue.add({
          endpoint: '/api/tasks/log',
          method: 'POST',
          body: logData,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to log task:', err);
    } finally {
      setLoadingTaskId(null);
    }
  }

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

  if (!user || !allLogs) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading eldroplus...</p>
        </div>
      </div>
    );
  }

  const isChallengeStarted = user?.startDate
    ? isDayUnlocked(1, user.startDate)
    : (user?.batchId ? false : !!user?.challengeStarted);

  // Filter logs for today
  const todayDateString = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = allLogs.filter((l) => Number(l.dayNumber) === Number(currentDayNumber) || l.date === todayDateString);
  const todayLogMap = {};
  todayLogs.forEach((l) => {
    todayLogMap[l.taskId] = l;
  });

  const completedTodayCount = TASK_ORDER.filter((t) => {
    const log = todayLogMap[t];
    return isTaskCompleted(t, log, currentDayNumber, currentDayNumber);
  }).length;

  const todayProgressPercent = (completedTodayCount / TASK_ORDER.length) * 100;

  // Stats calculation over allLogs
  function getCumStat(taskId, avg = false) {
    const items = allLogs.filter((l) => l.taskId === taskId && l.amount > 0);
    if (!items.length) return null;
    const total = items.reduce((s, l) => s + l.amount, 0);
    return avg ? +(total / items.length).toFixed(1) : total;
  }

  const totalWater = getCumStat('water');
  const totalYoga = getCumStat('yoga');
  const totalMeditation = getCumStat('meditation');
  const avgSleep = getCumStat('sleep', true);
  const totalProtein = getCumStat('protein');
  // const totalProtein = getCumStat('protein');

  const avgYoga = getCumStat('yoga', true);
  const avgMeditation = getCumStat('meditation', true);
  const avgWater = getCumStat('water', true);

  // Days completed (all 5 tasks completed)
  let completedDaysCount = 0;
  for (let d = 1; d <= totalDays; d++) {
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
  // const proteinData = getChartData('protein');
  const meditationData = getChartData('meditation');

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
      <header className="px-4 py-3.5 flex items-center justify-between border-b border-black/[0.05] bg-white/70 backdrop-blur-2xl sticky top-0 z-20">
        <div>
          <span className="text-[11px] font-medium text-[#86868B]">{greeting},</span>
          <h2 className="text-sm font-display font-bold text-[#1D1D1F] tracking-tight">{firstName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {user.batchName && (
            <span className="bg-black/[0.04] text-[#1D1D1F] border border-black/[0.06] px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-tight">
              {user.batchName}
            </span>
          )}
          <button
            onClick={() => setShowInstallGuide(true)}
            disabled={isInstalled}
            className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-[11px] border transition-all duration-150 ${
              isInstalled
                ? 'bg-black/[0.03] border-transparent text-[#86868B] cursor-not-allowed'
                : 'bg-[#00A86B] text-white border-transparent hover:bg-[#00915C] active:scale-95 shadow-sm'
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
            {user.startDate ? (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  Your wellness challenge is scheduled to begin on:
                </p>
                <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 font-bold text-sm font-mono">
                  {new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  You are assigned to the **{user.packageId?.name || 'Tester Pack'}** package. Please start the challenge on your profile page to begin.
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="mt-4 btn-brand px-6 py-2.5 rounded-xl font-bold text-xs shadow-brand"
                >
                  Go to Profile (Settings)
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Greeting Hero Card */}
          <div className="rounded-[24px] p-6 text-[#1D1D1F] relative overflow-hidden bg-white border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="relative flex justify-between items-start">
              <div>
                <p className="text-[#86868B] text-[11px] font-semibold tracking-wider uppercase">Overview</p>
                <h2 className="font-display font-bold text-2xl mt-0.5 text-[#1D1D1F] tracking-tight">
                  Day {currentDayNumber}
                  <span className="text-[#86868B] font-normal text-lg"> / {totalDays}</span>
                </h2>
                <p className="text-xs text-[#86868B] mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 px-3 py-1 rounded-full text-xs font-semibold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  {completedTodayCount} / {TASK_ORDER.length} Done
                </span>
              </div>
            </div>
          </div>

          {/* Live Session Section */}
          <LiveSessionCard />

          {/* CTA Link to Tasks */}
          <Link 
            to="/tasks" 
            className="block relative overflow-hidden rounded-[24px] p-5 sm:p-6 border border-black/[0.06] bg-white hover:border-black/[0.12] transition-all active:scale-[0.99] shadow-[0_2px_12px_rgba(0,0,0,0.03)] group"
          >
            <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#00A86B] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,168,107,0.3)] transition-transform group-hover:translate-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-base text-[#1D1D1F] tracking-tight">Log Today's Tasks</h3>
            <p className="text-xs text-[#86868B] mt-1 max-w-[80%] font-medium">Open your {totalDays}-day timeline roadmap and complete your daily tasks checklist.</p>
          </Link>

          {/* Streaks & Cumulative Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Streak & Completion Cards */}
            <div className="md:col-span-1 bg-white rounded-[20px] border border-black/[0.06] p-4 flex flex-col justify-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-[#1D1D1F] leading-none">{streak}</p>
                  <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider mt-1">Day Streak</p>
                </div>
              </div>
              <div className="h-px bg-black/[0.05]" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-[#1D1D1F] leading-none">{completedDaysCount}</p>
                  <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider mt-1">Days Done</p>
                </div>
              </div>
            </div>

            {/* Total Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={TASK_CONFIG.yoga.icon} label="Yoga & Fitness Total" value={totalYoga ? `${totalYoga}m` : null} colorClass="text-emerald-500" borderColor="border-emerald-500/10" />
              <StatCard icon={TASK_CONFIG.meditation.icon} label="Meditation Total" value={totalMeditation ? `${totalMeditation}m` : null} colorClass="text-purple-500" borderColor="border-purple-500/10" />
              <StatCard icon={TASK_CONFIG.water.icon} label="Water Total" value={totalWater ? totalWater >= 1000 ? `${(totalWater/1000).toFixed(1)}L` : `${totalWater}ml` : null} colorClass="text-cyan-500" borderColor="border-cyan-500/10" />
              <StatCard icon={TASK_CONFIG.sleep.icon} label="Avg Sleep" value={avgSleep ? `${avgSleep}h` : null} colorClass="text-indigo-500" borderColor="border-indigo-500/10" />
            </div>

          {/* Performance Trends Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-semibold text-[#86868B] uppercase tracking-widest px-1">Performance Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water Intake Chart */}
              <div className="bg-white rounded-[22px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-[#0071E3] uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.water.icon} Water Trend
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={waterData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cWater" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0071E3" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <YAxis tickFormatter={(val) => val >= 1000 ? `${val/1000}L` : val} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <Tooltip content={<CustomTooltip unit="ml" />} cursor={{ stroke: '#F0F0F2', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#0071E3" strokeWidth={2.5} fillOpacity={1} fill="url(#cWater)" dot={{ r: 2.5, stroke: '#0071E3', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sleep Duration Chart */}
              <div className="bg-white rounded-[22px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-[#5856D6] uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.sleep.icon} Sleep Trend
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5856D6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#5856D6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <YAxis tickFormatter={(val) => `${val}h`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <Tooltip content={<CustomTooltip unit="hrs" />} cursor={{ stroke: '#F0F0F2', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#5856D6" strokeWidth={2.5} fillOpacity={1} fill="url(#cSleep)" dot={{ r: 2.5, stroke: '#5856D6', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>


              {/* Yoga Intake Chart */}
              <div className="bg-white rounded-[22px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-[#34C759] uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.yoga.icon} Yoga & Fitness Trend
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yogaData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cYoga" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34C759" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#F0F0F2', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#34C759" strokeWidth={2.5} fillOpacity={1} fill="url(#cYoga)" dot={{ r: 2.5, stroke: '#34C759', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Meditation Chart */}
              <div className="bg-white rounded-[22px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-[#AF52DE] uppercase tracking-widest flex items-center gap-1.5">
                    {TASK_CONFIG.meditation.icon} Meditation Trend
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={meditationData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cMeditation" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#AF52DE" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#AF52DE" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868B' }} />
                      <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#F0F0F2', strokeWidth: 1 }} />
                      <Area connectNulls={true} type="monotone" dataKey="val" stroke="#AF52DE" strokeWidth={2.5} fillOpacity={1} fill="url(#cMeditation)" dot={{ r: 2.5, stroke: '#AF52DE', strokeWidth: 1.5, fill: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Cumulative Statistics Card */}
            <div className="md:col-span-2 bg-white border border-black/[0.06] rounded-[22px] p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 mb-3">
                <span className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider">Overall Habit Progress</span>
                <span className="text-[10px] text-[#00A86B] font-semibold bg-[#00A86B]/10 px-2.5 py-0.5 rounded-full border border-[#00A86B]/20">Average Performance</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                <div className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
                  <p className="text-[9px] text-[#86868B] font-semibold uppercase">Avg Yoga &amp; Fitness</p>
                  <p className="font-display font-bold text-sm text-[#1D1D1F] mt-1">{avgYoga ? `${avgYoga}m` : "0m"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
                  <p className="text-[9px] text-[#86868B] font-semibold uppercase">Avg Meditation</p>
                  <p className="font-display font-bold text-sm text-[#1D1D1F] mt-1">{avgMeditation ? `${avgMeditation}m` : "0m"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
                  <p className="text-[9px] text-[#86868B] font-semibold uppercase">Avg Water</p>
                  <p className="font-display font-bold text-sm text-[#1D1D1F] mt-1">{avgWater ? (avgWater >= 1000 ? `${(avgWater/1000).toFixed(1)}L` : `${Math.round(avgWater)}ml`) : "0L"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
                  <p className="text-[9px] text-[#86868B] font-semibold uppercase">Avg Sleep</p>
                  <p className="font-display font-bold text-sm text-[#1D1D1F] mt-1">{avgSleep ? `${avgSleep}h` : "0h"}</p>
                </div>
              </div>
            </div>

</div>
          </div>

        </div>
      )}

      {/* PWA Install Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 text-center shadow-2xl border border-black/[0.08] relative animate-scale-in">
            <button 
              onClick={() => setShowInstallGuide(false)}
              className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] text-xs font-bold transition-colors absolute top-4 right-4"
            >
              ✕
            </button>

            <div className="w-14 h-14 bg-[#00A86B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#00A86B] border border-[#00A86B]/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-lg text-[#1D1D1F] tracking-tight">Install eldroplus App</h2>
            <p className="text-xs text-[#86868B] mt-1 font-medium">Save this health challenge to your home screen for quick daily check-ins.</p>

            {!isInstalled && deferredPrompt && (
              <button
                onClick={async () => {
                   if (deferredPrompt) {
                     deferredPrompt.prompt();
                     const { outcome } = await deferredPrompt.userChoice;
                     if (outcome === "accepted") {
                       console.log("User accepted the install prompt");
                     }
                     window.deferredPrompt = null;
                     setDeferredPrompt(null);
                     setIsInstalled(true);
                     setShowInstallGuide(false);
                   }
                }}
                className="mt-5 w-full bg-[#00A86B] hover:bg-[#00915C] text-white font-semibold text-xs py-3 px-4 rounded-full shadow-[0_2px_8px_rgba(0,168,107,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Install App
              </button>
            )}

            <div className="mt-5 text-left border-t border-black/[0.06] pt-4 space-y-2">
              <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-widest">Install Instructions</p>
              <p className="text-xs text-[#86868B] leading-relaxed font-medium">
                Tap your browser menu (Share or three dots) and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
