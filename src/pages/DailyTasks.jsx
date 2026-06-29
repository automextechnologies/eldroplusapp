import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { formatDate, isDayUnlocked, getUnlockDate, formatUnlockDate } from '../utils/dateUtils';
import { TASK_ORDER } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import TaskCard from '../components/shared/TaskCard';

export default function DailyTasks() {
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();

  const [activeDay, setActiveDay] = useState(currentDayNumber);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  const horizontalScrollRef = useRef(null);

  useEffect(() => {
    if (currentDayNumber) {
      setActiveDay(currentDayNumber);
    }
  }, [currentDayNumber]);

  // Center horizontal scroll on active day
  useEffect(() => {
    if (horizontalScrollRef.current) {
      const activeEl = horizontalScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeDay]);

  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!user || !allLogs) return null;

  const isChallengeStarted = user.startDate ? isDayUnlocked(1, user.startDate) : true;

  // Active day status
  const isUnlocked = isDayUnlocked(activeDay, user.startDate);
  const isFuture = !isUnlocked;
  const isPast = isUnlocked && activeDay < currentDayNumber;
  const isToday = isUnlocked && activeDay === currentDayNumber;

  function isTaskReadonly(taskId) {
    if (isFuture) return true;
    if (isToday) return false;
    if (activeDay === currentDayNumber - 1 && taskId === 'sleep') {
      return false; // yesterday's sleep can be logged today
    }
    return true;
  }

  // Active day logs
  const activeDayLogs = allLogs.filter((l) => l.dayNumber === activeDay);
  const logMap = {};
  activeDayLogs.forEach((l) => {
    logMap[l.taskId] = l;
  });

  const completedCount = TASK_ORDER.filter((t) => {
    const log = logMap[t];
    return isTaskCompleted(t, log, activeDay, currentDayNumber);
  }).length;

  const activeProgressPercent = (completedCount / 5) * 100;

  const activeDayDate = user.startDate
    ? (() => {
        const d = new Date(user.startDate);
        d.setDate(d.getDate() + activeDay - 1);
        return format(d, 'EEEE, MMM d');
      })()
    : '';

  async function handleLogSubmit(taskId, data) {
    setLoadingTaskId(taskId);
    try {
      const targetDate = (() => {
        const d = new Date(user.startDate);
        d.setDate(d.getDate() + activeDay - 1);
        return formatDate(d);
      })();

      let completed = true;
      if (taskId === 'water') {
        completed = activeDay === currentDayNumber ? false : data.amount >= 2500;
      } else if (taskId === 'protein') {
        completed = activeDay === currentDayNumber ? false : data.amount >= 60;
      }

      const optimisticLog = {
        dayNumber: activeDay,
        taskId,
        date: targetDate,
        completed,
        amount: data.amount,
        unit: data.unit,
        completedAt: new Date().toISOString(),
        forDay: data.forDay,
      };

      const existing = await db.taskLogs.where({ dayNumber: activeDay, taskId }).first();
      if (existing) {
        await db.taskLogs.update(existing.id, optimisticLog);
      } else {
        await db.taskLogs.add(optimisticLog);
      }

      setExpandedTaskId(null);

      api.post('/api/tasks/log', { dayNumber: activeDay, taskId, ...data, completed, date: targetDate }).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTaskId(null);
    }
  }

  function getDayStatus(dNum) {
    if (!isDayUnlocked(dNum, user.startDate)) return 'locked';
    const dLogs = allLogs.filter((l) => l.dayNumber === dNum);
    const doneCount = TASK_ORDER.filter((taskId) => {
      const log = dLogs.find((l) => l.taskId === taskId);
      return isTaskCompleted(taskId, log, dNum, currentDayNumber);
    }).length;
    const allDone = doneCount === 5;

    if (dNum === currentDayNumber) return allDone ? 'complete' : doneCount > 0 ? 'partial' : 'today';
    if (dNum < currentDayNumber) return allDone ? 'complete' : doneCount > 0 ? 'partial' : 'missed';
    return 'unlocked';
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-12">
      {/* Mobile Horizontal Day Timeline */}
      <div 
        ref={horizontalScrollRef}
        className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar py-3 px-4 bg-white/60 border-b border-gray-200 sticky top-0 z-30 backdrop-blur-md"
      >
        {Array.from({ length: 30 }, (_, i) => {
          const dNum = i + 1;
          const dStatus = getDayStatus(dNum);
          const isActive = activeDay === dNum;
          
          return (
            <button
              key={dNum}
              data-active={isActive}
              onClick={() => {
                setActiveDay(dNum);
                setExpandedTaskId(null);
              }}
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                isActive 
                  ? 'border-2 border-brand-500 bg-brand-50 text-brand-600 font-black' 
                  : dStatus === 'locked'
                  ? 'border border-dashed border-gray-200 text-gray-300 bg-gray-50'
                  : dStatus === 'complete'
                  ? 'border border-emerald-500/30 bg-emerald-50/50 text-emerald-600'
                  : dStatus === 'missed'
                  ? 'border border-red-500/20 bg-red-50/50 text-red-500'
                  : 'border border-gray-200 bg-white text-gray-400 shadow-sm'
              }`}
            >
              <span className="text-[10px] font-bold leading-none">{dNum}</span>
              {dStatus === 'complete' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />}
              {dStatus === 'missed' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500" />}
              {dStatus === 'today' && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />}
            </button>
          );
        })}
      </div>

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
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Vertical Roadmap timeline (lg:col-span-4 hidden lg:block) */}
          <aside className="lg:col-span-4 hidden lg:block bg-white border border-gray-200 rounded-3xl p-4 sticky top-6 h-[80vh] overflow-y-auto no-scrollbar shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">Journey Roadmap</h3>
            <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-4 py-2">
              {Array.from({ length: 30 }, (_, i) => {
                const dNum = i + 1;
                const dStatus = getDayStatus(dNum);
                const isActive = activeDay === dNum;

                return (
                  <button
                    key={dNum}
                    onClick={() => {
                      setActiveDay(dNum);
                      setExpandedTaskId(null);
                    }}
                    className="flex items-center gap-3 text-left w-full relative group"
                  >
                    <div className={`absolute -left-[33px] w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                      isActive 
                        ? 'border-brand-500 bg-white scale-125 shadow-[0_0_8px_rgba(232,76,30,0.3)]' 
                        : dStatus === 'locked'
                        ? 'border-dashed border-gray-300 bg-white'
                        : dStatus === 'complete'
                        ? 'border-emerald-500 bg-emerald-500'
                        : dStatus === 'missed'
                        ? 'border-red-500 bg-red-100'
                        : 'border-gray-200 bg-white'
                    }`}
                    >
                      {dStatus === 'complete' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className={`flex-1 px-3 py-2 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-brand-50 border border-brand-500/20' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}>
                      <p className={`text-xs font-extrabold leading-none ${isActive ? 'text-brand-600' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        Day {dNum}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                        {dStatus === 'locked' ? 'Locked' : dStatus === 'complete' ? 'Completed' : dStatus === 'missed' ? 'Missed' : 'Open'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Selected active day Workspace (lg:col-span-8) */}
          <main className="col-span-1 lg:col-span-8 space-y-6">
            <div 
              className="rounded-3xl p-6 text-brand-950 relative overflow-hidden shadow-sm border border-brand-500/10"
              style={{ background: 'linear-gradient(135deg, #FFF0EB 0%, #FFE0D6 100%)' }}
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-md pointer-events-none" />
              <div className="relative flex justify-between items-start">
                <div>
                  <p className="text-brand-600 text-[10px] font-extrabold tracking-widest uppercase">Workspace</p>
                  <h2 className="font-display font-extrabold text-2xl mt-0.5 text-brand-950">Day {activeDay}</h2>
                  <p className="text-xs text-brand-700 font-semibold mt-1">{activeDayDate}</p>
                </div>
                <div className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider border ${
                  completedCount === 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-brand-500/10 border-brand-500/20 text-brand-700'
                }`}>
                  {completedCount} / 5 Done
                </div>
              </div>

              {!isFuture && (
                <div className="relative mt-6 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-brand-950">
                    <span>PROGRESS LOGGED</span>
                    <span className="font-mono">{Math.round(activeProgressPercent)}%</span>
                  </div>
                  <div className="h-2.5 bg-brand-500/15 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(232,76,30,0.15)]"
                      style={{ width: `${activeProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {isFuture && (
                <div className="mt-5 flex items-center gap-2 p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20 text-xs text-brand-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span>Unlocks {formatUnlockDate(getUnlockDate(activeDay, user.startDate))}</span>
                </div>
              )}
            </div>

            {isFuture ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-sm font-bold text-gray-900">This day is locked</p>
                <p className="text-xs text-gray-500 mt-1">Unlock date: {new Date(getUnlockDate(activeDay, user.startDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {TASK_ORDER.map((taskId) => (
                  <TaskCard
                    key={taskId}
                    taskId={taskId}
                    log={logMap[taskId]}
                    dayNumber={activeDay}
                    currentDayNumber={currentDayNumber}
                    readonly={isTaskReadonly(taskId)}
                    expanded={expandedTaskId === taskId}
                    onToggleExpand={() => setExpandedTaskId(expandedTaskId === taskId ? null : taskId)}
                    onSubmit={handleLogSubmit}
                    loading={loadingTaskId === taskId}
                  />
                ))}
              </div>
            )}

            {isPast && (
              <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center flex items-center justify-center gap-2 shadow-sm">
                <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-500 font-semibold">
                  {activeDay === currentDayNumber - 1 
                    ? "Only yesterday's sleep can be logged. Other tasks are locked."
                    : "This day has ended. Logs are read-only."}
                </p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
