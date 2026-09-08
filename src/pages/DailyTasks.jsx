import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { formatDate, isDayUnlocked as isDayUnlockedDate } from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import TaskCard from '../components/shared/TaskCard';

const PRE_RECORDED_VIDEOS = [
  {
    title: "15 Min Daily Stretch & Mobility Routine",
    youtubeId: "d83Vz1Lz44s",
    description: "Start your day with this simple routine to enhance mobility and flexibility."
  },
  {
    title: "10 Min Energizing Morning Yoga",
    youtubeId: "4PkcfVjG7Kk",
    description: "Boost your energy and focus with gentle movements and breathwork."
  },
  {
    title: "10 Min Mindfulness Breathing Meditation",
    youtubeId: "ZToicYcHIOU",
    description: "Centering meditation to reduce anxiety, stress, and bring mental clarity."
  },
  {
    title: "15 Min Low Impact Full Body Strength",
    youtubeId: "gC_L9_DMct8",
    description: "Build stamina and strength with low impact, joints-friendly exercises."
  },
  {
    title: "12 Min Deep Sleep & Relaxation Yoga",
    youtubeId: "O-6f5wQXSu8",
    description: "Unwind after a busy day to prepare your mind and body for restful sleep."
  }
];

export default function DailyTasks() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();

  const [activeDay, setActiveDay] = useState(currentDayNumber || 1);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  const isChallengeStarted = user?.startDate
    ? isDayUnlockedDate(1, user.startDate)
    : (user?.batchId ? false : !!user?.challengeStarted);

  // Sequential sleep-based unlock logic:
  // Day 1 is unlocked when challenge begins.
  // Day d (d > 1) unlocks only after all previous days 1 .. d - 1 have Sleep Task completed.
  function isDayAccessible(dNum) {
    if (!isChallengeStarted) return false;
    if (dNum === 1) return true;
    if (!allLogs) return false;
    for (let prev = 1; prev < dNum; prev++) {
      const hasSleep = allLogs.some(
        (l) => Number(l.dayNumber) === prev && l.taskId === 'sleep' && (l.completed === true || l.completed === 1 || (l.amount !== undefined && Number(l.amount) > 0))
      );
      if (!hasSleep) return false;
    }
    return true;
  }

  // Set default active day to currentDayNumber if accessible, or the furthest unlocked day
  useEffect(() => {
    if (!allLogs || !user) return;
    const target = currentDayNumber || 1;
    if (isDayAccessible(target)) {
      setActiveDay(target);
    } else {
      let furthest = 1;
      for (let d = 1; d <= 30; d++) {
        if (isDayAccessible(d)) {
          furthest = d;
        } else {
          break;
        }
      }
      setActiveDay(furthest);
    }
  }, [currentDayNumber, allLogs?.length, isChallengeStarted]);

  if (!user || !allLogs) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading daily tasks...</p>
        </div>
      </div>
    );
  }

  const isUnlocked = isDayAccessible(activeDay);

  // Status for Days grid tiles
  function getDayStatus(dNum) {
    if (!isDayAccessible(dNum)) return 'locked';
    const dLogs = allLogs.filter((l) => Number(l.dayNumber) === dNum);
    const doneCount = TASK_ORDER.filter((taskId) => {
      const log = dLogs.find((l) => l.taskId === taskId);
      return isTaskCompleted(taskId, log, dNum, currentDayNumber);
    }).length;
    const allDone = doneCount === TASK_ORDER.length;

    if (allDone) return 'complete';
    if (doneCount > 0) return 'partial';
    if (dNum === currentDayNumber) return 'today';
    return 'unlocked';
  }

  // Active day logs & progress calculation (exclusive to activeDay)
  const activeDayLogs = allLogs.filter((l) => Number(l.dayNumber) === Number(activeDay));
  const logMap = {};
  activeDayLogs.forEach((l) => {
    logMap[l.taskId] = l;
  });

  const completedCount = TASK_ORDER.filter((t) => {
    const log = logMap[t];
    return isTaskCompleted(t, log, activeDay, currentDayNumber);
  }).length;

  const activeProgressPercent = (completedCount / TASK_ORDER.length) * 100;

  const activeDayDate = user.startDate
    ? (() => {
        const d = new Date(user.startDate);
        d.setDate(d.getDate() + activeDay - 1);
        return format(d, 'EEEE, MMM d');
      })()
    : `Day ${activeDay}`;

  // Find the exact missing previous day that locks activeDay (for action button)
  const missingPreviousSleepDay = (() => {
    if (isUnlocked || activeDay <= 1) return null;
    for (let d = 1; d < activeDay; d++) {
      const hasSleep = allLogs.some(
        (l) => Number(l.dayNumber) === d && l.taskId === 'sleep' && (l.completed === true || l.completed === 1 || (l.amount !== undefined && Number(l.amount) > 0))
      );
      if (!hasSleep) return d;
    }
    return activeDay - 1;
  })();

  async function handleLogSubmit(taskId, data) {
    setLoadingTaskId(taskId);
    try {
      const targetDate = (() => {
        const d = new Date(user.startDate || new Date());
        d.setDate(d.getDate() + activeDay - 1);
        return formatDate(d);
      })();

      let completed = true;
      if (taskId === 'water') {
        completed = activeDay === currentDayNumber ? false : Number(data.amount) >= 2500;
      } else if (taskId === 'protein') {
        completed = activeDay === currentDayNumber ? false : Number(data.amount) >= 60;
      } else if (taskId === 'sleep' || taskId === 'yoga' || taskId === 'meditation') {
        completed = Number(data.amount) > 0;
      }

      const optimisticLog = {
        dayNumber: Number(activeDay),
        taskId,
        date: targetDate,
        completed,
        amount: Number(data.amount) || 0,
        unit: data.unit,
        completedAt: new Date().toISOString(),
      };

      const existing = await db.taskLogs.where('[dayNumber+taskId]').equals([Number(activeDay), taskId]).first()
        || await db.taskLogs.filter(l => Number(l.dayNumber) === Number(activeDay) && l.taskId === taskId).first();

      if (existing) {
        await db.taskLogs.update(existing.id, optimisticLog);
      } else {
        await db.taskLogs.add(optimisticLog);
      }

      setExpandedTaskId(null);

      api.post('/api/tasks/log', {
        dayNumber: Number(activeDay),
        taskId,
        ...data,
        completed,
        date: targetDate,
      }).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTaskId(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-20">
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
                  Your 30-day wellness challenge is scheduled to begin on:
                </p>
                <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 font-bold text-sm font-mono">
                  {new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  Please start the challenge on your profile page to begin.
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
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 1. DAYS SECTION (5-column Grid matching screenshot) */}
            <section className="order-2 lg:order-1 col-span-1 lg:col-span-5 bg-white border border-gray-200/90 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <div>
                  <h3 className="font-display font-extrabold text-gray-900 text-base">Challenge Days</h3>
                  <p className="text-[11px] font-semibold text-gray-400">Select a day to view & log tasks</p>
                </div>
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                  Day {activeDay} of 30
                </span>
              </div>

              {/* 5-Column Squircle Days Grid */}
              <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                {Array.from({ length: 30 }, (_, i) => {
                  const dNum = i + 1;
                  const dStatus = getDayStatus(dNum);
                  const isActive = activeDay === dNum;
                  const isLocked = dStatus === 'locked';

                  return (
                    <button
                      key={dNum}
                      type="button"
                      onClick={() => {
                        setActiveDay(dNum);
                        setExpandedTaskId(null);
                        if (window.innerWidth < 1024) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 select-none ${
                        isActive
                          ? 'ring-4 ring-brand-500/80 ring-offset-2 scale-105 shadow-md z-10'
                          : 'hover:scale-[1.02] active:scale-95'
                      } ${
                        isLocked
                          ? 'bg-[#709ba6]/60 text-white/80 opacity-75 shadow-sm'
                          : dStatus === 'complete'
                          ? 'bg-[#408a73] text-white shadow-sm'
                          : 'bg-[#568796] text-white shadow-sm'
                      }`}
                      style={{
                        borderRadius: '1.15rem',
                      }}
                    >
                      <span className="font-display font-extrabold text-base sm:text-xl leading-none">
                        {dNum}
                      </span>

                      {/* Locked icon indicator */}
                      {isLocked && (
                        <svg className="w-3 h-3 text-white/80 absolute bottom-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}

                      {/* Completed checkmark badge */}
                      {dStatus === 'complete' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-[#408a73]" />
                      )}

                      {/* Current day indicator */}
                      {dStatus === 'today' && !isLocked && (
                        <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2 text-[10px] font-bold text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[#568796]" /> Open
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[#408a73]" /> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[#709ba6]/60" /> Locked
                </span>
              </div>
            </section>

            {/* 2. ACTIVE DAY SECTION & TASK LIST */}
            <main className="order-1 lg:order-2 col-span-1 lg:col-span-7 space-y-5">
              
              {/* Day Header & Progress Card */}
              <div
                className="rounded-3xl p-6 text-brand-950 relative overflow-hidden shadow-sm border border-brand-500/15"
                style={{ background: 'linear-gradient(135deg, #F2F8F4 0%, #c1e2cb 100%)' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-brand-600 text-[10px] font-extrabold tracking-widest uppercase">
                      Workspace · Day {activeDay}
                    </p>
                    <h2 className="font-display font-extrabold text-2xl mt-0.5 text-brand-950">
                      Day {activeDay}
                    </h2>
                    <p className="text-xs text-brand-800/80 font-semibold mt-0.5">
                      {activeDayDate}
                    </p>
                  </div>

                  <div className={`px-3 py-1 rounded-xl text-[11px] font-bold font-mono tracking-wider border shadow-xs ${
                    !isUnlocked
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : completedCount === TASK_ORDER.length
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-white/80 border-brand-500/30 text-brand-800'
                  }`}>
                    {!isUnlocked ? '🔒 Locked' : `${completedCount} / ${TASK_ORDER.length} Done`}
                  </div>
                </div>

                {/* Day Task Progress Inside Day Section */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-brand-950">
                    <span className="tracking-wide uppercase text-[11px] text-brand-900/80">
                      Day {activeDay} Progress
                    </span>
                    <span className="font-mono text-brand-950 font-extrabold">
                      {Math.round(activeProgressPercent)}%
                    </span>
                  </div>

                  <div className="h-3 bg-white/60 rounded-full overflow-hidden p-0.5 border border-brand-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${activeProgressPercent}%` }}
                    />
                  </div>

                  {/* Task icons completion summary */}
                  <div className="flex items-center gap-2 pt-2">
                    {TASK_ORDER.map((tId) => {
                      const isDone = isTaskCompleted(tId, logMap[tId], activeDay, currentDayNumber);
                      const cfg = TASK_CONFIG[tId];
                      return (
                        <div
                          key={tId}
                          title={`${cfg?.label || tId}: ${isDone ? 'Completed' : 'Pending'}`}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-white/70 text-gray-500 border border-brand-500/15'
                          }`}
                        >
                          <span>{cfg?.icon}</span>
                          <span className="capitalize">{cfg?.label || tId}</span>
                          {isDone && <span>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Locked Notice or Task Cards */}
              {!isUnlocked ? (
                <div className="bg-amber-50/90 border-2 border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-amber-100 border border-amber-300 rounded-2xl mx-auto flex items-center justify-center text-amber-700">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-gray-900 text-lg">
                      Day {activeDay} is Locked
                    </h3>
                    <p className="text-sm font-semibold text-amber-900 mt-1.5 leading-relaxed max-w-md mx-auto">
                      Complete your previous day's Sleep Task to unlock today's tasks.
                    </p>
                  </div>

                  {activeDay > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = missingPreviousSleepDay || activeDay - 1;
                        setActiveDay(target);
                        setExpandedTaskId('sleep');
                        if (window.innerWidth < 1024) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs shadow-brand transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <span>Complete Day {missingPreviousSleepDay || activeDay - 1} Sleep Task</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Daily Class Video (Non-batch users) */}
                  {!user.batchId && (
                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm space-y-4">
                      <div className="px-6 pt-5 flex justify-between items-center">
                        <div>
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100 uppercase tracking-wide">
                            Daily Class Video 📹
                          </span>
                          <h3 className="font-display font-extrabold text-sm text-gray-900 mt-1.5">
                            {PRE_RECORDED_VIDEOS[(activeDay - 1) % 5].title}
                          </h3>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-1 rounded">
                          Day {activeDay} Video
                        </span>
                      </div>

                      <div className="aspect-video w-full bg-black relative">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${PRE_RECORDED_VIDEOS[(activeDay - 1) % 5].youtubeId}?rel=0&modestbranding=1`}
                          title={PRE_RECORDED_VIDEOS[(activeDay - 1) % 5].title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>

                      <p className="text-xs text-gray-500 px-6 pb-5 leading-relaxed">
                        {PRE_RECORDED_VIDEOS[(activeDay - 1) % 5].description}
                      </p>
                    </div>
                  )}

                  {/* Task Cards List */}
                  <div className="space-y-3">
                    {TASK_ORDER.map((taskId) => (
                      <TaskCard
                        key={taskId}
                        taskId={taskId}
                        log={logMap[taskId]}
                        dayNumber={activeDay}
                        currentDayNumber={currentDayNumber}
                        readonly={false}
                        expanded={expandedTaskId === taskId}
                        onToggleExpand={() => setExpandedTaskId(expandedTaskId === taskId ? null : taskId)}
                        onSubmit={handleLogSubmit}
                        loading={loadingTaskId === taskId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
