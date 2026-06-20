import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useStreak } from '../hooks/useStreak';
import { useNotifications } from '../hooks/useNotifications';
import { formatDate, isDayUnlocked } from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import { isTaskCompleted } from '../utils/taskCompletion';

const REQUIRED = ['yoga', 'meditation', 'water', 'protein'];

function StatCard({ icon, label, value, bg, textColor }) {
  return (
    <div className={`flex-shrink-0 ${bg} rounded-2xl px-4 py-3.5 min-w-[108px] border border-white/60 premium-card premium-active flex flex-col justify-between`}>
      <div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${textColor} bg-white/40`}>
          {icon}
        </div>
        <p className={`font-mono font-extrabold text-[15px] leading-none ${textColor}`}>{value || '—'}</p>
      </div>
      <p className="text-[10px] text-gray-500 font-bold mt-2 tracking-wide uppercase leading-none">{label}</p>
    </div>
  );
}

function TaskRow({ taskId, log }) {
  const config = TASK_CONFIG[taskId];
  const done = log?.completed;

  function formatVal() {
    if (!done) return null;
    if (taskId === 'water') return log.amount >= 1000 ? `${(log.amount/1000).toFixed(1)}L` : `${log.amount}ml`;
    if (taskId === 'yoga' || taskId === 'meditation') return `${log.amount} min`;
    if (taskId === 'protein') return `${log.amount}g`;
    if (taskId === 'sleep') return `${log.amount} hrs`;
    return `${log.amount}`;
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border bg-white border-[#EAECF0]"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.lightBg, color: config.color }}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-gray-900">{config.name}</p>
        <p className="text-xs text-gray-500 font-semibold truncate mt-0.5">
          {done ? formatVal() : 'Not completed today'}
        </p>
      </div>
      {done ? (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.color }}>
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0 bg-gray-50/50" />
      )}
    </div>
  );
}

export default function Dashboard() {
  const user = useUserStore((s) => s.user);
  const isChallengeStarted = user?.startDate ? isDayUnlocked(1, user.startDate) : true;
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const streak = useStreak(currentDayNumber);
  const { scheduleToday } = useNotifications();

  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    scheduleToday();
  }, []);

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

    const handlePwaInstallable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };
    window.addEventListener('pwa-installable', handlePwaInstallable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installable', handlePwaInstallable);
    };
  }, []);

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      return 'ios';
    }
    if (/Android/.test(ua)) {
      return 'android';
    }
    return 'desktop';
  }

  const todayDate = formatDate();
  const logs = useLiveQuery(
    () => db.taskLogs.where('date').equals(todayDate).toArray(),
    [todayDate]
  );
  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!user) return null;

  const logMap = {};
  logs?.forEach((l) => { logMap[l.taskId] = l; });

  const completedToday = TASK_ORDER.filter((t) => {
    const log = logMap[t];
    return isTaskCompleted(t, log, currentDayNumber, currentDayNumber);
  }).length;



  function getCumStat(taskId, avg = false) {
    if (!allLogs) return null;
    const items = allLogs.filter((l) => l.taskId === taskId && l.amount > 0);
    if (!items.length) return null;
    const total = items.reduce((s, l) => s + l.amount, 0);
    return avg ? +(total / items.length).toFixed(1) : total;
  }

  const totalWater = getCumStat('water');
  const totalYoga = getCumStat('yoga');
  const avgSleep = getCumStat('sleep', true);
  const totalProtein = getCumStat('protein');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] || 'there';

  const progressPercent = (completedToday / 5) * 100;

  let completedDays = 0;
  if (allLogs) {
    for (let d = 1; d < currentDayNumber; d++) {
      const dayLogs = allLogs.filter((l) => l.dayNumber === d);
      const isDayComplete = TASK_ORDER.every((taskId) => {
        const log = dayLogs.find((l) => l.taskId === taskId);
        return isTaskCompleted(taskId, log, d, currentDayNumber);
      });
      if (isDayComplete) completedDays++;
    }
  }

  const completedLogs = allLogs ? allLogs.filter((l) => l.completed) : [];

  // Sleep Data
  const sleepData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    const log = completedLogs.find((l) => l.taskId === 'sleep' && l.forDay === day);
    return {
      day: `Day ${day}`,
      hours: log ? log.amount : null,
    };
  });

  // Water Data
  const waterData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    const log = completedLogs.find((l) => l.taskId === 'water' && l.dayNumber === day);
    return {
      day: `Day ${day}`,
      ml: log ? log.amount : null,
    };
  });

  // Yoga Data
  const yogaData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    const log = completedLogs.find((l) => l.taskId === 'yoga' && l.dayNumber === day);
    return {
      day: `Day ${day}`,
      minutes: log ? log.amount : null,
    };
  });

  // Meditation Data
  const meditationData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    const log = completedLogs.find((l) => l.taskId === 'meditation' && l.dayNumber === day);
    return {
      day: `Day ${day}`,
      minutes: log ? log.amount : null,
    };
  });

  // Protein Data
  const proteinData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    const log = completedLogs.find((l) => l.taskId === 'protein' && l.dayNumber === day);
    return {
      day: `Day ${day}`,
      grams: log ? log.amount : null,
    };
  });

  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div className="premium-glass p-3 !rounded-xl">
          <p className="text-xs font-medium text-muted mb-1">{label}</p>
          <p className="text-sm font-bold text-gray-900">
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface md:p-4">

      {/* ── Header ── */}
      <div 
        className="px-5 pt-14 pb-20 md:py-10 md:rounded-3xl relative overflow-hidden shadow-sm mb-6"
        style={{ background: 'linear-gradient(135deg, #7A1E04 0%, #C83A0E 55%, #E84C1E 100%)' }}
      >
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/5 blur-md pointer-events-none" />
        <div className="absolute top-10 -left-8 w-28 h-28 rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting}</p>
            <h1 className="font-display font-extrabold text-2xl text-white mt-0.5">{firstName}</h1>
            <p className="text-white/60 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
            {user.batchName && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white border border-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <svg className="w-3 h-3 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {user.batchName}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <div className="bg-white/15 border border-white/20 rounded-2xl px-3 py-1.5 backdrop-blur-sm">
              {isChallengeStarted ? (
                <p className="text-white font-display font-bold text-sm">Day {currentDayNumber}<span className="text-white/50 font-medium"> / 30</span></p>
              ) : (
                <p className="text-white font-display font-bold text-sm">Not Started</p>
              )}
            </div>
            
            <button
              disabled={isInstalled}
              onClick={() => setShowInstallGuide(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all backdrop-blur-sm border ${
                isInstalled
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white text-[#C83A0E] border-white hover:bg-white/90 active:scale-[0.97]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {isInstalled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                )}
              </svg>
              <span>{isInstalled ? 'Installed' : 'Add to Home'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {isChallengeStarted ? (
          <div className="relative mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs font-semibold">TODAY'S PROGRESS</p>
              <p className="text-white font-bold text-xs">{completedToday}/5 tasks</p>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex mt-2 gap-1.5">
              {TASK_ORDER.map((taskId) => {
                const c = TASK_CONFIG[taskId];
                const done = logMap[taskId]?.completed;
                return (
                  <div
                    key={taskId}
                    className="flex-1 h-1 rounded-full transition-all duration-500"
                    style={{ backgroundColor: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative mt-6 flex items-center gap-2 text-white/90 bg-white/10 rounded-2xl p-3 border border-white/15">
            <svg className="w-5 h-5 text-white/85" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">Challenge starts on {user.startDate ? new Date(user.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
          </div>
        )}
      </div>

      {/* ── Content Grid ── */}
      {!isChallengeStarted ? (
        <div className="-mt-8 md:mt-0 max-w-md mx-auto px-4 pb-28 md:pb-8 w-full">
          <div className="bg-white rounded-3xl border border-border p-8 text-center shadow-card mt-6">
            <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl mx-auto flex items-center justify-center mb-4 text-orange-600 shadow-inner-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-display font-extrabold text-gray-900 text-lg">Challenge has not started yet</h2>
            <p className="text-sm text-gray-500 mt-2">
              Your 30-day wellness challenge is scheduled to begin on:
            </p>
            <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-100 rounded-2xl text-brand-700 font-bold text-sm font-mono">
              {user.startDate ? new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} at 1:00 AM
            </p>
            <div className="mt-6 border-t border-gray-150 pt-5 text-left space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">What to expect:</p>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-xs text-gray-600">Daily tasks (Yoga, Meditation, Water, Protein, Sleep) unlock one day at a time.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-xs text-gray-600">Day 1 will unlock automatically on the start date at 1:00 AM.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-xs text-gray-600">Log all 5 tasks daily to maintain your streak and achieve your goals!</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="-mt-8 md:mt-0 grid grid-cols-1 md:grid-cols-12 gap-6 pb-28 md:pb-8">
          
          {/* Left Column (Streak, Cumulative Stats, Journey CTA) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* ── Streak + Stats row ── */}
            <div className="px-4 md:px-0">
              <div className="premium-card p-4">
                <div className="flex items-center gap-4">
                  {/* Streak */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`${streak >= 3 ? 'animate-pulse' : ''} text-[#ea580c]`}>
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display font-extrabold text-2xl text-gray-900 leading-none">{streak}</p>
                      <p className="text-xs text-muted font-medium mt-0.5">Day streak</p>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  {/* Days done */}
                  <div className="flex-1 text-center">
                    <p className="font-display font-extrabold text-2xl text-gray-900 leading-none">{completedDays}</p>
                    <p className="text-xs text-muted font-medium mt-0.5">Days done</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  {/* Completed today */}
                  <div className="flex-1 text-center">
                    <p className="font-display font-extrabold text-2xl text-brand-600 leading-none">{completedToday}/5</p>
                    <p className="text-xs text-muted font-medium mt-0.5">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Cumulative stats ── */}
            <div className="px-4 md:px-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Total So Far</p>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                <StatCard icon={TASK_CONFIG.yoga.icon} label="Yoga" value={totalYoga ? `${totalYoga}m` : null} bg="bg-green-50" textColor="text-green-700" />
                <StatCard icon={TASK_CONFIG.water.icon} label="Water" value={totalWater ? totalWater >= 1000 ? `${(totalWater/1000).toFixed(1)}L` : `${totalWater}ml` : null} bg="bg-blue-50" textColor="text-blue-700" />
                <StatCard icon={TASK_CONFIG.protein.icon} label="Protein" value={totalProtein ? `${totalProtein}g` : null} bg="bg-orange-50" textColor="text-orange-700" />
                <StatCard icon={TASK_CONFIG.sleep.icon} label="Avg sleep" value={avgSleep ? `${avgSleep}h` : null} bg="bg-indigo-50" textColor="text-indigo-700" />
              </div>
            </div>

          </div>

          {/* Right Column (Today's Tasks) */}
          <div className="md:col-span-5 space-y-6">
            
            {/* ── Today's tasks ── */}
            <div className="px-4 md:px-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Today's Tasks</p>
              </div>
              <div className="space-y-2.5">
                {TASK_ORDER.slice(0, 4).map((taskId) => (
                  <TaskRow key={taskId} taskId={taskId} log={logMap[taskId]} />
                ))}
              </div>
            </div>

          </div>

          {/* ── Analytics Charts ── */}
          <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
            {/* Sleep Chart */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">{TASK_CONFIG.sleep.icon}</span>
                <h2 className="font-display font-bold text-lg text-gray-900">Sleep Duration</h2>
              </div>
              <div className="premium-card p-4 h-64">
                {sleepData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sleepColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                      <YAxis tickFormatter={(val) => `${val}h`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip content={<CustomTooltip unit="hrs" />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area connectNulls={true} type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#sleepColor)" dot={{ r: 4, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted">
                    Not enough sleep data yet.
                  </div>
                )}
              </div>
            </section>

            {/* Water Chart */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sky-600">{TASK_CONFIG.water.icon}</span>
                <h2 className="font-display font-bold text-lg text-gray-900">Water Intake</h2>
              </div>
              <div className="premium-card p-4 h-64">
                {waterData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={waterData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="waterColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                      <YAxis tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}L` : `${val}ml`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip content={<CustomTooltip unit="ml" />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area connectNulls={true} type="monotone" dataKey="ml" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#waterColor)" dot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#0284c7' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted">
                    Not enough water data yet.
                  </div>
                )}
              </div>
            </section>

            {/* Yoga Chart */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600">{TASK_CONFIG.yoga.icon}</span>
                <h2 className="font-display font-bold text-lg text-gray-900">Yoga Duration</h2>
              </div>
              <div className="premium-card p-4 h-64">
                {yogaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yogaData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="yogaColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                      <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area connectNulls={true} type="monotone" dataKey="minutes" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#yogaColor)" dot={{ r: 4, stroke: '#16a34a', strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#16a34a' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted">
                    Not enough yoga data yet.
                  </div>
                )}
              </div>
            </section>

            {/* Meditation Chart */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-purple-600">{TASK_CONFIG.meditation.icon}</span>
                <h2 className="font-display font-bold text-lg text-gray-900">Meditation Duration</h2>
              </div>
              <div className="premium-card p-4 h-64">
                {meditationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={meditationData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="meditationColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                      <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area connectNulls={true} type="monotone" dataKey="minutes" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#meditationColor)" dot={{ r: 4, stroke: '#9333ea', strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#9333ea' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted">
                    Not enough meditation data yet.
                  </div>
                )}
              </div>
            </section>

            {/* Protein Chart */}
            <section className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">{TASK_CONFIG.protein.icon}</span>
                <h2 className="font-display font-bold text-lg text-gray-900">Protein Intake</h2>
              </div>
              <div className="premium-card p-4 h-64">
                {proteinData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={proteinData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="proteinColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                      <YAxis tickFormatter={(val) => `${val}g`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip content={<CustomTooltip unit="g" />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area connectNulls={true} type="monotone" dataKey="grams" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#proteinColor)" dot={{ r: 4, stroke: '#ea580c', strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#ea580c' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted">
                    Not enough protein data yet.
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      )}

      {/* ── Install Guide Modal ── */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-150 max-w-sm w-full p-6 relative animate-slide-up">
            {/* Close Button */}
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="text-center mt-2">
              <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h2 className="font-display font-extrabold text-xl text-gray-900">Add Eldro+ to Home</h2>
              <p className="text-sm text-gray-500 mt-1.5">Install the app on your device for quick access and daily reminders.</p>

              {/* Native Prompt Button if available */}
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
                  className="mt-5 w-full bg-gradient-to-r from-orange-600 to-[#E84C1E] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Install Now
                </button>
              )}

              {/* Instructions based on OS */}
              <div className="mt-6 text-left border-t border-gray-100 pt-5 space-y-4">
                {getDeviceType() === 'ios' && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Safari iOS Steps</p>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">1</div>
                      <p className="text-sm text-gray-600">
                        Tap the <span className="font-bold text-gray-900 inline-flex items-center gap-1">Share icon <svg className="w-4 h-4 text-blue-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></span> in Safari.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">2</div>
                      <p className="text-sm text-gray-600">
                        Scroll down and select <span className="font-bold text-gray-900">"Add to Home Screen"</span>.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">3</div>
                      <p className="text-sm text-gray-600">
                        Tap <span className="font-bold text-gray-900">"Add"</span> in the top-right corner to finish.
                      </p>
                    </div>
                  </>
                )}

                {getDeviceType() === 'android' && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Android Steps</p>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">1</div>
                      <p className="text-sm text-gray-600">
                        Tap the menu button <span className="font-bold text-gray-900 inline-flex items-center gap-0.5"><svg className="w-4 h-4 text-gray-600 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5h.01M12 12h.01M12 19h.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></span> in Chrome.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">2</div>
                      <p className="text-sm text-gray-600">
                        Select <span className="font-bold text-gray-900">"Install app"</span> or <span className="font-bold text-gray-900">"Add to Home Screen"</span>.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">3</div>
                      <p className="text-sm text-gray-600">
                        Confirm the installation in the prompt.
                      </p>
                    </div>
                  </>
                )}

                {getDeviceType() === 'desktop' && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Desktop Browser Steps</p>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">1</div>
                      <p className="text-sm text-gray-600">
                        Click the <span className="font-bold text-gray-900">Install icon</span> in your browser's address bar.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">2</div>
                      <p className="text-sm text-gray-600">
                        Or click the menu button <span className="font-bold text-gray-900 inline-flex items-center gap-0.5"><svg className="w-4 h-4 text-gray-600 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5h.01M12 12h.01M12 19h.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></span> and select <span className="font-bold text-gray-900">"Install app"</span>.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0 mt-0.5">3</div>
                      <p className="text-sm text-gray-600">
                        Click <span className="font-bold text-gray-900">"Install"</span> to confirm.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
