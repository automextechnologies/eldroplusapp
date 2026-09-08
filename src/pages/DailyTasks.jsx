import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import {
  formatDate,
  getDayTimings,
  isDayBlockUnlocked,
  isNormalTasksUnlocked,
  isSleepTaskUnlocked,
  isSleepTaskCompleted,
  isSleepTaskLocked,
  formatUnlockDate,
} from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import TaskCard from '../components/shared/TaskCard';

const PRE_RECORDED_VIDEOS = [
  {
    title: '15 Min Daily Stretch & Mobility Routine',
    youtubeId: 'd83Vz1Lz44s',
    description: 'Start your day with this simple routine to enhance mobility and flexibility.',
  },
  {
    title: '10 Min Energizing Morning Yoga',
    youtubeId: '4PkcfVjG7Kk',
    description: 'Boost your energy and focus with gentle movements and breathwork.',
  },
  {
    title: '10 Min Mindfulness Breathing Meditation',
    youtubeId: 'ZToicYcHIOU',
    description: 'Centering meditation to reduce anxiety, stress, and bring mental clarity.',
  },
  {
    title: '15 Min Low Impact Full Body Strength',
    youtubeId: 'gC_L9_DMct8',
    description: 'Build stamina and strength with low impact, joints-friendly exercises.',
  },
  {
    title: '12 Min Deep Sleep & Relaxation Yoga',
    youtubeId: 'O-6f5wQXSu8',
    description: 'Unwind after a busy day to prepare your mind and body for restful sleep.',
  },
];

const NORMAL_TASKS = ['yoga', 'meditation', 'water'];

export default function DailyTasks() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();

  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  // Map of which day blocks are currently expanded: { [dayNumber]: boolean }
  const [expandedDays, setExpandedDays] = useState({});
  // Which task is currently expanded for inline editing: e.g. "1-water" or "2-yesterday-sleep"
  const [expandedTaskKey, setExpandedTaskKey] = useState(null);
  const [loadingTaskKey, setLoadingTaskKey] = useState(null);

  const dayBlockRefs = useRef({});

  const isChallengeStarted = user?.startDate
    ? isDayBlockUnlocked(1, user.startDate)
    : (user?.batchId ? false : !!user?.challengeStarted);

  // Initialize expanded day to currentDayNumber (or Day 1) on load
  useEffect(() => {
    if (user?.startDate || user?.challengeStarted) {
      const active = currentDayNumber || 1;
      setExpandedDays((prev) => ({
        ...prev,
        [active]: true,
      }));
    }
  }, [currentDayNumber, user?.startDate]);

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

  function toggleDayBlock(dNum) {
    setExpandedDays((prev) => ({
      ...prev,
      [dNum]: !prev[dNum],
    }));
  }

  function expandAllDays() {
    const all = {};
    for (let d = 1; d <= 30; d++) all[d] = true;
    setExpandedDays(all);
  }

  function collapseAllDays() {
    setExpandedDays({});
  }

  function jumpToDay(dNum) {
    setExpandedDays((prev) => ({
      ...prev,
      [dNum]: true,
    }));
    setTimeout(() => {
      const el = dayBlockRefs.current[dNum];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  async function handleLogSubmit(dayNum, taskId, data) {
    const key = `${dayNum}-${taskId}`;
    setLoadingTaskKey(key);
    try {
      const targetDate = (() => {
        const d = new Date(user.startDate || new Date());
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + dayNum - 1);
        return formatDate(d);
      })();

      let completed = true;
      if (taskId === 'water') {
        completed = dayNum === currentDayNumber ? false : Number(data.amount) >= 2500;
      } else if (taskId === 'protein') {
        completed = dayNum === currentDayNumber ? false : Number(data.amount) >= 60;
      } else if (taskId === 'sleep' || taskId === 'yoga' || taskId === 'meditation') {
        completed = Number(data.amount) > 0;
      }

      const optimisticLog = {
        dayNumber: Number(dayNum),
        taskId,
        date: targetDate,
        completed,
        amount: Number(data.amount) || 0,
        unit: data.unit,
        completedAt: new Date().toISOString(),
      };

      const existing =
        (await db.taskLogs.where('[dayNumber+taskId]').equals([Number(dayNum), taskId]).first()) ||
        (await db.taskLogs.filter((l) => Number(l.dayNumber) === Number(dayNum) && l.taskId === taskId).first());

      if (existing) {
        await db.taskLogs.update(existing.id, optimisticLog);
      } else {
        await db.taskLogs.add(optimisticLog);
      }

      setExpandedTaskKey(null);

      // Background sync to server
      api
        .post('/api/tasks/log', {
          dayNumber: Number(dayNum),
          taskId,
          ...data,
          completed,
          date: targetDate,
        })
        .catch((err) => {
          console.error('[tasks/log error]', err);
        });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTaskKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24">
      {!isChallengeStarted ? (
        <div className="max-w-md mx-auto px-4 py-12 text-center w-full">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-card">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4 text-orange-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="font-display font-extrabold text-gray-900 text-lg">Challenge has not started yet</h2>
            {user.startDate ? (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  Your 30-day wellness challenge is scheduled to begin on:
                </p>
                <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 font-bold text-sm font-mono">
                  {new Date(user.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* TOP HEADER & GAME QUEST BAR */}
          <section className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200/60">
                    Day Blocks System
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    Day {currentDayNumber} of 30
                  </span>
                </div>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 mt-1">
                  Workspace Progression
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete each day's quest. Days unlock at 3:00 AM, normal tasks lock at 1:00 AM.
                </p>
              </div>

              {/* Expand / Collapse all toggles */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={expandAllDays}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllDays}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* QUICK JUMP DAY SELECTOR TRACK */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Quick Navigation (Days 1–30)
                </span>
                <span className="text-[11px] text-brand-600 font-bold">
                  Tap any day to jump
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                {Array.from({ length: 30 }, (_, i) => {
                  const dNum = i + 1;
                  const isUnlocked = isDayBlockUnlocked(dNum, user.startDate);
                  const isToday = dNum === currentDayNumber;
                  const isExpanded = !!expandedDays[dNum];

                  const dLogs = allLogs.filter((l) => Number(l.dayNumber) === dNum);
                  const doneCount = TASK_ORDER.filter((tId) => {
                    const l = dLogs.find((log) => log.taskId === tId);
                    return isTaskCompleted(tId, l, dNum, currentDayNumber);
                  }).length;
                  const isAllDone = doneCount === TASK_ORDER.length;

                  return (
                    <button
                      key={dNum}
                      type="button"
                      onClick={() => jumpToDay(dNum)}
                      className={`flex-shrink-0 w-11 h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 snap-center select-none ${
                        isToday
                          ? 'ring-3 ring-brand-500 ring-offset-2 scale-105 font-black z-10'
                          : isExpanded
                          ? 'ring-2 ring-gray-400 font-bold'
                          : 'font-bold hover:scale-105'
                      } ${
                        !isUnlocked
                          ? 'bg-gray-100 text-gray-400 border border-gray-200/80'
                          : isAllDone
                          ? 'bg-[#408a73] text-white shadow-xs'
                          : isToday
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'bg-[#568796] text-white'
                      }`}
                    >
                      <span className="text-xs font-mono leading-none">{dNum}</span>
                      <span className="text-[8px] leading-tight mt-0.5">
                        {!isUnlocked ? '🔒' : isAllDone ? '✓' : `${doneCount}/4`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* DAY BLOCKS FEED (DAYS 1 TO 30) */}
          <div className="space-y-4">
            {Array.from({ length: 30 }, (_, i) => {
              const dNum = i + 1;
              const timings = getDayTimings(dNum, user.startDate);
              const isUnlocked = isDayBlockUnlocked(dNum, user.startDate);
              const isNormalUnlocked = isNormalTasksUnlocked(dNum, user.startDate);
              const isToday = dNum === currentDayNumber;
              const isExpanded = !!expandedDays[dNum];

              const dLogs = allLogs.filter((l) => Number(l.dayNumber) === dNum);
              const logMap = {};
              dLogs.forEach((l) => {
                logMap[l.taskId] = l;
              });

              // Completion count
              const completedCount = TASK_ORDER.filter((tId) => {
                return isTaskCompleted(tId, logMap[tId], dNum, currentDayNumber);
              }).length;
              const progressPercent = (completedCount / TASK_ORDER.length) * 100;
              const isAllDone = completedCount === TASK_ORDER.length;

              const formattedDate = timings?.dayDate
                ? format(timings.dayDate, 'EEEE, MMM d')
                : `Day ${dNum}`;

              // Previous Day Sleep for Day d >= 2
              const prevDayNum = dNum - 1;
              const prevDaySleepLog =
                dNum > 1
                  ? allLogs.find((l) => Number(l.dayNumber) === prevDayNum && l.taskId === 'sleep')
                  : null;
              const prevDaySleepCompleted = prevDaySleepLog && isSleepTaskCompleted(prevDaySleepLog);
              const prevDaySleepLocked =
                dNum > 1
                  ? isSleepTaskLocked(prevDayNum, user.startDate, prevDaySleepLog)
                  : true;

              // Current Day d Sleep Task
              const currentSleepLog = logMap['sleep'];
              const currentSleepCompleted = isSleepTaskCompleted(currentSleepLog);
              const currentSleepLocked = isSleepTaskLocked(dNum, user.startDate, currentSleepLog);

              return (
                <article
                  key={dNum}
                  ref={(el) => (dayBlockRefs.current[dNum] = el)}
                  id={`day-block-${dNum}`}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                    !isUnlocked
                      ? 'bg-gray-50/70 border-gray-200/80 shadow-xs'
                      : isAllDone
                      ? 'bg-white border-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.08)]'
                      : isToday
                      ? 'bg-white border-brand-500/40 shadow-[0_6px_24px_rgba(132,180,156,0.14)] ring-1 ring-brand-500/20'
                      : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  {/* EXPANDABLE DAY BLOCK HEADER */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleDayBlock(dNum)}
                    className={`w-full flex items-center justify-between p-5 sm:p-6 cursor-pointer select-none transition-colors ${
                      isExpanded
                        ? 'border-b border-gray-100 bg-gray-50/40'
                        : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Day Number Squircle */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all ${
                          !isUnlocked
                            ? 'bg-gray-200 text-gray-500'
                            : isAllDone
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isToday
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'bg-[#568796] text-white'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-extrabold tracking-wider leading-none">
                          Day
                        </span>
                        <span className="font-display font-black text-xl leading-tight">
                          {dNum}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-display font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                            Day {dNum}
                          </h2>

                          {isToday && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              Today
                            </span>
                          )}

                          {!isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 text-gray-600 border border-gray-300">
                              🔒 Locked
                            </span>
                          ) : isAllDone ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ 100% Done
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                              {completedCount} / 4 Done
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                          {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      {/* Mini progress bar when collapsed */}
                      {!isExpanded && isUnlocked && (
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-gray-500">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      )}

                      {/* Expand/Collapse Chevron */}
                      <div className="w-8 h-8 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-transform duration-300">
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180 text-brand-600' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DAY BLOCK CONTENT */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6">
                      {!isUnlocked ? (
                        /* LOCKED DAY BLOCK MESSAGE */
                        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-6 text-center space-y-2">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center text-amber-700">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-display font-extrabold text-gray-900 text-sm">
                            Day {dNum} is Locked
                          </h3>
                          <p className="text-xs text-amber-900 font-semibold max-w-sm mx-auto">
                            {timings
                              ? `Unlocks on ${formatUnlockDate(timings.dayUnlockTime)}.`
                              : 'This day is not yet available.'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Each day automatically unlocks at 3:00 AM on its scheduled date.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* 1. IN-BLOCK PROGRESS TRACKER */}
                          <div
                            className="rounded-2xl p-5 border border-brand-500/20 shadow-xs"
                            style={{
                              background: 'linear-gradient(135deg, #F2F8F4 0%, #d8ede0 100%)',
                            }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-[10px] font-extrabold text-brand-700 uppercase tracking-widest">
                                  Day {dNum} Quest Progress
                                </span>
                                <p className="font-display font-black text-xl text-brand-950">
                                  {isAllDone
                                    ? '🎉 All Tasks Complete!'
                                    : `${completedCount} of ${TASK_ORDER.length} Complete`}
                                </p>
                              </div>
                              <span className="font-mono text-2xl font-black text-brand-950">
                                {Math.round(progressPercent)}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-3 bg-white/70 rounded-full overflow-hidden p-0.5 border border-brand-500/20">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 shadow-xs"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            {/* Task chips */}
                            <div className="flex items-center gap-2 pt-3 flex-wrap">
                              {TASK_ORDER.map((tId) => {
                                const isDone = isTaskCompleted(
                                  tId,
                                  logMap[tId],
                                  dNum,
                                  currentDayNumber
                                );
                                const cfg = TASK_CONFIG[tId];
                                return (
                                  <div
                                    key={tId}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                      isDone
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white/80 text-gray-600 border border-brand-500/20'
                                    }`}
                                  >
                                    <span>{cfg?.icon}</span>
                                    <span className="capitalize">{cfg?.name || tId}</span>
                                    {isDone && <span className="text-white font-extrabold">✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. CONVENIENT YESTERDAY'S SLEEP TASK (FOR DAY d >= 2) */}
                          {dNum > 1 && (
                            <div className="space-y-2 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">🌙</span>
                                  <div>
                                    <h3 className="font-display font-extrabold text-xs text-indigo-950 uppercase tracking-wide">
                                      Yesterday's Sleep (Day {prevDayNum} Sleep)
                                    </h3>
                                    <p className="text-[11px] text-indigo-800/70 font-medium">
                                      {prevDaySleepCompleted
                                        ? `Logged ${prevDaySleepLog?.amount || 0} hrs · Completed & Locked`
                                        : !isSleepTaskUnlocked(prevDayNum, user.startDate)
                                        ? 'Unlocks at 3:00 AM'
                                        : 'Log last night’s sleep to complete Day ' + prevDayNum + ' sleep'}
                                    </p>
                                  </div>
                                </div>
                                {prevDaySleepCompleted ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Completed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Independent Task
                                  </span>
                                )}
                              </div>

                              <TaskCard
                                taskId="sleep"
                                log={prevDaySleepLog}
                                dayNumber={prevDayNum}
                                currentDayNumber={currentDayNumber}
                                readonly={prevDaySleepLocked}
                                lockReason={
                                  prevDaySleepCompleted
                                    ? '✓ Completed (Locked)'
                                    : '🔒 Unlocks at 3:00 AM'
                                }
                                customTitle={`Yesterday's Sleep (Day ${prevDayNum})`}
                                customSubtitle={
                                  prevDaySleepCompleted
                                    ? `${prevDaySleepLog?.amount || 0} hrs · Completed & Locked`
                                    : 'How many hours did you sleep last night?'
                                }
                                expanded={expandedTaskKey === `${prevDayNum}-yesterday-sleep`}
                                onToggleExpand={() =>
                                  setExpandedTaskKey(
                                    expandedTaskKey === `${prevDayNum}-yesterday-sleep`
                                      ? null
                                      : `${prevDayNum}-yesterday-sleep`
                                  )
                                }
                                onSubmit={(tId, data) => handleLogSubmit(prevDayNum, 'sleep', data)}
                                loading={loadingTaskKey === `${prevDayNum}-sleep`}
                              />
                            </div>
                          )}

                          {/* 3. TODAY'S NORMAL TASKS (WATER, YOGA, MEDITATION) */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pt-1">
                              <div>
                                <h3 className="font-display font-extrabold text-sm text-gray-900">
                                  Day {dNum} Tasks
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                  {isNormalUnlocked
                                    ? 'Active until 1:00 AM tonight'
                                    : '🔒 Normal tasks locked at 1:00 AM'}
                                </p>
                              </div>
                              {!isNormalUnlocked && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                                  Locked at 1:00 AM
                                </span>
                              )}
                            </div>

                            {NORMAL_TASKS.map((taskId) => (
                              <TaskCard
                                key={taskId}
                                taskId={taskId}
                                log={logMap[taskId]}
                                dayNumber={dNum}
                                currentDayNumber={currentDayNumber}
                                readonly={!isNormalUnlocked}
                                lockReason="🔒 Locked at 1:00 AM"
                                expanded={expandedTaskKey === `${dNum}-${taskId}`}
                                onToggleExpand={() =>
                                  setExpandedTaskKey(
                                    expandedTaskKey === `${dNum}-${taskId}`
                                      ? null
                                      : `${dNum}-${taskId}`
                                  )
                                }
                                onSubmit={(tId, data) => handleLogSubmit(dNum, tId, data)}
                                loading={loadingTaskKey === `${dNum}-${taskId}`}
                              />
                            ))}
                          </div>

                          {/* 4. DAY d SLEEP TASK */}
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-display font-extrabold text-sm text-gray-900">
                                  Day {dNum} Sleep
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                  {currentSleepCompleted
                                    ? '✓ Completed and locked'
                                    : 'Unlocks tomorrow morning at 3:00 AM'}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">
                                Independent
                              </span>
                            </div>

                            <TaskCard
                              taskId="sleep"
                              log={currentSleepLog}
                              dayNumber={dNum}
                              currentDayNumber={currentDayNumber}
                              readonly={currentSleepLocked}
                              lockReason={
                                currentSleepCompleted
                                  ? '✓ Completed (Locked)'
                                  : '🔒 Unlocks tomorrow at 3:00 AM'
                              }
                              customSubtitle={
                                currentSleepCompleted
                                  ? `${currentSleepLog?.amount || 0} hrs · Completed (Locked)`
                                  : '🔒 Unlocks tomorrow at 3:00 AM'
                              }
                              expanded={expandedTaskKey === `${dNum}-sleep`}
                              onToggleExpand={() =>
                                setExpandedTaskKey(
                                  expandedTaskKey === `${dNum}-sleep` ? null : `${dNum}-sleep`
                                )
                              }
                              onSubmit={(tId, data) => handleLogSubmit(dNum, 'sleep', data)}
                              loading={loadingTaskKey === `${dNum}-sleep`}
                            />
                          </div>

                          {/* 5. CLASS VIDEO (NON-BATCH USERS) */}
                          {!user.batchId && (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs space-y-3 pt-2">
                              <div className="px-5 pt-3 flex justify-between items-center">
                                <div>
                                  <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100 uppercase tracking-wide">
                                    Day {dNum} Routine Video 📹
                                  </span>
                                  <h4 className="font-display font-extrabold text-xs text-gray-900 mt-1">
                                    {PRE_RECORDED_VIDEOS[(dNum - 1) % 5].title}
                                  </h4>
                                </div>
                              </div>

                              <div className="aspect-video w-full bg-black relative">
                                <iframe
                                  className="w-full h-full"
                                  src={`https://www.youtube.com/embed/${
                                    PRE_RECORDED_VIDEOS[(dNum - 1) % 5].youtubeId
                                  }?rel=0&modestbranding=1`}
                                  title={PRE_RECORDED_VIDEOS[(dNum - 1) % 5].title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>

                              <p className="text-xs text-gray-500 px-5 pb-4 leading-relaxed">
                                {PRE_RECORDED_VIDEOS[(dNum - 1) % 5].description}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
