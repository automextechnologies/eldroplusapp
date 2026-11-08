import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const NORMAL_TASKS = ['yoga', 'meditation', 'water'];

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

export default function DayDetail() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = Math.min(Math.max(parseInt(dayParam, 10) || 1, 1), 30);
  const navigate = useNavigate();

  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();

  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  // Which task is expanded for logging: e.g. "yoga", "water", "yesterday-sleep"
  const [expandedTaskKey, setExpandedTaskKey] = useState(null);
  const [loadingTaskKey, setLoadingTaskKey] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState('');

  // Lock and timing status calculations
  const timings = useMemo(
    () => getDayTimings(dayNumber, user?.startDate),
    [dayNumber, user?.startDate]
  );
  const isUnlocked = isDayBlockUnlocked(dayNumber, user?.startDate);
  const isNormalUnlocked = isNormalTasksUnlocked(dayNumber, user?.startDate);
  const isToday = dayNumber === currentDayNumber;
  const isPast = dayNumber < currentDayNumber;

  const isChallengeStarted = user?.startDate
    ? isDayBlockUnlocked(1, user.startDate)
    : (user?.batchId ? false : !!user?.challengeStarted);

  // Logs for this specific day
  const dayLogs = useMemo(() => {
    if (!allLogs) return [];
    return allLogs.filter((l) => Number(l.dayNumber) === dayNumber);
  }, [allLogs, dayNumber]);

  const logMap = useMemo(() => {
    const map = {};
    dayLogs.forEach((l) => {
      map[l.taskId] = l;
    });
    return map;
  }, [dayLogs]);

  // Previous Day Sleep for Day >= 2
  const prevDayNum = dayNumber - 1;
  const prevDaySleepLog = useMemo(() => {
    if (dayNumber <= 1 || !allLogs) return null;
    return allLogs.find((l) => Number(l.dayNumber) === prevDayNum && l.taskId === 'sleep');
  }, [allLogs, dayNumber, prevDayNum]);

  const prevDaySleepCompleted = prevDaySleepLog && isSleepTaskCompleted(prevDaySleepLog);
  const prevDaySleepLocked =
    dayNumber > 1
      ? isSleepTaskLocked(prevDayNum, user?.startDate, prevDaySleepLog)
      : true;

  // Day's Sleep Task
  const currentSleepLog = logMap['sleep'];
  const currentSleepCompleted = isSleepTaskCompleted(currentSleepLog);
  const currentSleepLocked = isSleepTaskLocked(dayNumber, user?.startDate, currentSleepLog);

  // Completion calculation
  const completedCount = useMemo(() => {
    return TASK_ORDER.filter((tId) => {
      return isTaskCompleted(tId, logMap[tId], dayNumber, currentDayNumber);
    }).length;
  }, [logMap, dayNumber, currentDayNumber]);

  const progressPercent = Math.round((completedCount / TASK_ORDER.length) * 100);
  const isAllDone = completedCount === TASK_ORDER.length;

  const formattedDate = timings?.dayDate
    ? format(timings.dayDate, 'EEEE, MMMM d, yyyy')
    : `Day ${dayNumber}`;

  if (!user || !allLogs) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading Day {dayNumber} tasks...</p>
        </div>
      </div>
    );
  }

  // Handle task submission
  async function handleLogSubmit(targetDayNum, taskId, data) {
    const key = `${targetDayNum}-${taskId}`;
    setLoadingTaskKey(key);
    try {
      const targetDate = (() => {
        const d = new Date(user.startDate || new Date());
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + targetDayNum - 1);
        return formatDate(d);
      })();

      let completed = true;
      if (taskId === 'water') {
        completed = targetDayNum === currentDayNumber ? false : Number(data.amount) >= 2500;
      } else if (taskId === 'protein') {
        completed = targetDayNum === currentDayNumber ? false : Number(data.amount) >= 60;
      } else if (taskId === 'sleep' || taskId === 'yoga' || taskId === 'meditation') {
        completed = Number(data.amount) > 0;
      }

      const optimisticLog = {
        dayNumber: Number(targetDayNum),
        taskId,
        date: targetDate,
        completed,
        amount: Number(data.amount) || 0,
        unit: data.unit,
        completedAt: new Date().toISOString(),
      };

      const existing =
        (await db.taskLogs.where('[dayNumber+taskId]').equals([Number(targetDayNum), taskId]).first()) ||
        (await db.taskLogs.filter((l) => Number(l.dayNumber) === Number(targetDayNum) && l.taskId === taskId).first());

      if (existing) {
        await db.taskLogs.update(existing.id, optimisticLog);
      } else {
        await db.taskLogs.add(optimisticLog);
      }

      setExpandedTaskKey(null);
      setFeedbackToast(`Saved ${TASK_CONFIG[taskId]?.name || taskId}!`);
      setTimeout(() => setFeedbackToast(''), 2500);

      // Background server sync
      api
        .post('/api/tasks/log', {
          dayNumber: Number(targetDayNum),
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
    <div className="min-h-screen bg-surface flex flex-col pb-28 md:pb-12">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 backdrop-blur-md text-white text-xs font-bold rounded-2xl px-4 py-2.5 shadow-xl border border-emerald-700/60 animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* TOP STICKY NAVIGATION BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06] shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Back button to Tasks */}
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/[0.06] text-[#1D1D1F] bg-black/[0.03] hover:bg-black/[0.06] active:scale-95 transition-all text-xs font-semibold"
          >
            <svg className="w-4 h-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Tasks</span>
          </button>

          {/* Day Title and Date */}
          <div className="text-center min-w-0 flex-1 px-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-[#1D1D1F]">
                Day {dayNumber}
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20">
                  Today
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#86868B] font-medium truncate">
              {formattedDate}
            </p>
          </div>

          {/* Day Switcher: Prev & Next Day buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={dayNumber <= 1}
              onClick={() => navigate(`/day/${dayNumber - 1}`)}
              className="w-8 h-8 rounded-full border border-black/[0.06] bg-black/[0.03] hover:bg-black/[0.06] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[#1D1D1F] text-sm font-semibold transition-colors"
              title="Previous Day"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={dayNumber >= 30}
              onClick={() => navigate(`/day/${dayNumber + 1}`)}
              className="w-8 h-8 rounded-full border border-black/[0.06] bg-black/[0.03] hover:bg-black/[0.06] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[#1D1D1F] text-sm font-semibold transition-colors"
              title="Next Day"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 sm:pt-6 space-y-5">
        {/* DAY STATUS: LOCKED OR CHALLENGE NOT STARTED */}
        {!isChallengeStarted ? (
          <div className="bg-white rounded-[24px] border border-black/[0.06] p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl mx-auto flex items-center justify-center text-amber-600">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-[#1D1D1F] text-lg">Challenge has not started</h2>
            {user.startDate ? (
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Day {dayNumber} will unlock when the challenge begins on{' '}
                <span className="font-semibold text-[#00A86B] font-mono">
                  {new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>.
              </p>
            ) : (
              <div className="pt-2">
                <p className="text-xs text-[#86868B]">Please start the challenge in your Profile Settings.</p>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="mt-3 px-6 py-2.5 bg-[#00A86B] text-white rounded-full text-xs font-semibold shadow-sm hover:bg-[#00915C] transition-colors"
                >
                  Go to Profile
                </button>
              </div>
            )}
          </div>
        ) : !isUnlocked ? (
          /* LOCKED DAY BLOCK BANNER */
          <div className="bg-black/[0.02] border border-black/[0.06] rounded-[24px] p-8 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 bg-black/[0.04] border border-black/[0.06] rounded-2xl mx-auto flex items-center justify-center text-[#86868B]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-[#1D1D1F] text-lg">
              Day {dayNumber} is Locked
            </h2>
            <p className="text-xs text-[#1D1D1F] font-semibold max-w-md mx-auto">
              {timings
                ? `This day automatically unlocks on ${formatUnlockDate(timings.dayUnlockTime)}.`
                : 'This day is not yet available.'}
            </p>
            <p className="text-[11px] text-[#86868B]">
              Complete each scheduled day on its date to maintain your challenge streak.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="px-5 py-2.5 rounded-full border border-black/[0.08] bg-white text-[#1D1D1F] font-semibold text-xs hover:bg-black/[0.03] shadow-2xs"
              >
                Back to Calendar
              </button>
              {currentDayNumber && currentDayNumber !== dayNumber && (
                <button
                  type="button"
                  onClick={() => navigate(`/day/${currentDayNumber}`)}
                  className="px-5 py-2.5 rounded-full bg-[#00A86B] text-white font-semibold text-xs shadow-sm hover:bg-[#00915C]"
                >
                  Go to Today (Day {currentDayNumber})
                </button>
              )}
            </div>
          </div>
        ) : (
          /* UNLOCKED DAY: DAY QUEST PROGRESS & ADD TASKS LAYOUT */
          <>
            {/* 1. DAY PROGRESS BANNER */}
            <section
              className="rounded-[24px] p-5 sm:p-6 bg-white border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-widest">
                    Day {dayNumber} Progress
                  </span>
                  <h2 className="font-display font-bold text-2xl text-[#1D1D1F] tracking-tight">
                    {isAllDone
                      ? '🎉 All Tasks Complete!'
                      : `${completedCount} of ${TASK_ORDER.length} Complete`}
                  </h2>
                </div>
              </div>

              {/* Task checklist chips */}
              <div className="flex items-center gap-2 pt-3.5 flex-wrap">
                {TASK_ORDER.map((tId) => {
                  const isDone = isTaskCompleted(
                    tId,
                    logMap[tId],
                    dayNumber,
                    currentDayNumber
                  );
                  const cfg = TASK_CONFIG[tId];
                  return (
                    <div
                      key={tId}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isDone
                          ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 shadow-2xs'
                          : 'bg-black/[0.03] text-[#86868B] border border-black/[0.05]'
                      }`}
                    >
                      <span>{cfg?.icon}</span>
                      <span className="capitalize">{cfg?.name || tId}</span>
                      {isDone ? (
                        <span className="font-bold text-[#34C759]">✓</span>
                      ) : (
                        <span className="text-[#86868B] text-[10px]">Pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. ADD TASKS LAYOUT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-display font-bold text-base text-[#1D1D1F]">
                    Daily Task Checklist
                  </h3>
                  <p className="text-xs text-[#86868B] font-medium">
                    Tap any task below to log or adjust your amount.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
                  {completedCount}/{TASK_ORDER.length} Completed
                </span>
              </div>

              {/* A. CONVENIENT YESTERDAY'S SLEEP TASK (FOR DAY >= 2) */}
              {dayNumber > 1 && (
                <div className="space-y-2 bg-[#5856D6]/[0.04] border border-[#5856D6]/15 rounded-[24px] p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#5856D6]/15 text-[#5856D6] flex items-center justify-center text-sm">
                        🌙
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-xs text-indigo-950 uppercase tracking-wide">
                          Yesterday's Sleep (Day {prevDayNum})
                        </h4>
                        <p className="text-[11px] text-indigo-800/80 font-medium">
                          {prevDaySleepCompleted
                            ? `Logged ${prevDaySleepLog?.amount || 0} hrs · Completed & Locked`
                            : !isSleepTaskUnlocked(prevDayNum, user.startDate)
                            ? 'Unlocks at 3:00 AM'
                            : `Log last night’s sleep to complete Day ${prevDayNum} sleep`}
                        </p>
                      </div>
                    </div>
                    {prevDaySleepCompleted ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Independent
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

              {/* B. TODAY'S NORMAL TASKS (YOGA, MEDITATION, WATER) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-gray-500">
                    Day {dayNumber} Regular Tasks
                  </h4>
                  {!isNormalUnlocked && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                      🔒 Locked at 1:00 AM
                    </span>
                  )}
                </div>

                {NORMAL_TASKS.map((taskId) => (
                  <TaskCard
                    key={taskId}
                    taskId={taskId}
                    log={logMap[taskId]}
                    dayNumber={dayNumber}
                    currentDayNumber={currentDayNumber}
                    readonly={!isNormalUnlocked}
                    lockReason="🔒 Locked at 1:00 AM"
                    expanded={expandedTaskKey === `${dayNumber}-${taskId}`}
                    onToggleExpand={() =>
                      setExpandedTaskKey(
                        expandedTaskKey === `${dayNumber}-${taskId}`
                          ? null
                          : `${dayNumber}-${taskId}`
                      )
                    }
                    onSubmit={(tId, data) => handleLogSubmit(dayNumber, tId, data)}
                    loading={loadingTaskKey === `${dayNumber}-${taskId}`}
                  />
                ))}
              </div>

              {/* C. DAY'S SLEEP TASK */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="font-display font-extrabold text-sm text-gray-900">
                      Day {dayNumber} Sleep
                    </h4>
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
                  dayNumber={dayNumber}
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
                  expanded={expandedTaskKey === `${dayNumber}-sleep`}
                  onToggleExpand={() =>
                    setExpandedTaskKey(
                      expandedTaskKey === `${dayNumber}-sleep`
                        ? null
                        : `${dayNumber}-sleep`
                    )
                  }
                  onSubmit={(tId, data) => handleLogSubmit(dayNumber, 'sleep', data)}
                  loading={loadingTaskKey === `${dayNumber}-sleep`}
                />
              </div>

              {/* D. CLASS ROUTINE VIDEO (NON-BATCH USERS) */}
              {!user.batchId && (
                <div className="bg-white rounded-[24px] border border-black/[0.06] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 pt-2">
                  <div className="px-5 pt-3 flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 bg-black/[0.04] text-[#1D1D1F] text-[10px] font-semibold rounded-full border border-black/[0.06] uppercase tracking-wide">
                        Day {dayNumber} Routine Video 📹
                      </span>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-[#1D1D1F] mt-1">
                        {PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].title}
                      </h4>
                    </div>
                  </div>

                  <div className="aspect-video w-full bg-black relative">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${
                        PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].youtubeId
                      }?rel=0&modestbranding=1`}
                      title={PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>

                  <p className="text-xs text-[#86868B] px-5 pb-4 leading-relaxed font-normal">
                    {PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].description}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
