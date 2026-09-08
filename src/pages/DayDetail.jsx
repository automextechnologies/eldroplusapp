import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { isDayUnlocked, formatDate } from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import TaskCard from '../components/shared/TaskCard';
import BottomSheet from '../components/shared/BottomSheet';
import YogaTask from '../components/tasks/YogaTask';
import MeditationTask from '../components/tasks/MeditationTask';
import WaterTask from '../components/tasks/WaterTask';
import ProteinTask from '../components/tasks/ProteinTask';
import SleepTask from '../components/tasks/SleepTask';

const TASK_COMPONENTS = {
  yoga: YogaTask,
  meditation: MeditationTask,
  water: WaterTask,
  protein: ProteinTask,
  sleep: SleepTask,
};

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

export default function DayDetail() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = parseInt(dayParam, 10);
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();

  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(false);

  const logs = useLiveQuery(
    () => db.taskLogs.where('dayNumber').equals(dayNumber).toArray(),
    [dayNumber]
  );
  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!user || !allLogs) return null;

  const isChallengeStarted = user.batchId ? (user.startDate ? isDayUnlocked(1, user.startDate) : false) : !!user.challengeStarted;

  function isDayAccessible(dNum) {
    if (!isChallengeStarted) return false;
    if (dNum === 1) return true;
    for (let prev = 1; prev < dNum; prev++) {
      const hasSleep = allLogs.some(
        (l) => l.dayNumber === prev && l.taskId === 'sleep' && l.completed
      );
      if (!hasSleep) return false;
    }
    return true;
  }

  const isUnlocked = isDayAccessible(dayNumber);
  const isFuture = !isUnlocked;
  const isPast = isUnlocked && dayNumber < currentDayNumber;

  function isTaskReadonly(taskId) {
    if (isFuture) return true;
    return false;
  }

  const logMap = {};
  logs?.forEach((l) => { logMap[l.taskId] = l; });
  
  const completedCount = TASK_ORDER.filter((t) => {
    const log = logMap[t];
    return isTaskCompleted(t, log, dayNumber, currentDayNumber);
  }).length;

  const dayDate = user.startDate
    ? (() => {
        const d = new Date(user.startDate);
        d.setDate(d.getDate() + dayNumber - 1);
        return format(d, 'EEEE, MMM d');
      })()
    : `Day ${dayNumber}`;

  async function handleSubmit(taskId, data) {
    setLoading(true);
    try {
      const targetDate = (() => {
        const d = new Date(user.startDate || new Date());
        d.setDate(d.getDate() + dayNumber - 1);
        return formatDate(d);
      })();

      let completed = true;
      if (taskId === 'water') {
        completed = dayNumber === currentDayNumber ? false : data.amount >= 2500;
      } else if (taskId === 'protein') {
        completed = dayNumber === currentDayNumber ? false : data.amount >= 60;
      }

      const optimisticLog = {
        dayNumber,
        taskId,
        date: targetDate,
        completed,
        amount: data.amount,
        unit: data.unit,
        completedAt: new Date().toISOString(),
      };

      const existing = await db.taskLogs.where({ dayNumber, taskId }).first();
      if (existing) {
        await db.taskLogs.update(existing.id, optimisticLog);
      } else {
        await db.taskLogs.add(optimisticLog);
      }

      setActiveTask(null);

      api.post('/api/tasks/log', { dayNumber, taskId, ...data, completed, date: targetDate }).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  const ActiveComponent = activeTask ? TASK_COMPONENTS[activeTask] : null;

  // Split tasks into editable and readonly
  const editableTasks = TASK_ORDER.filter(t => !isTaskReadonly(t));
  const readonlyTasks = TASK_ORDER.filter(t => isTaskReadonly(t));

  const progressPercent = (completedCount / TASK_ORDER.length) * 100;

  return (
    <div className="min-h-screen bg-surface pb-12">
      {/* Premium Sticky Top Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-400 hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-lg text-gray-900 leading-tight">Day {dayNumber} Details</h1>
            <p className="text-xs text-gray-500 font-semibold">{dayDate}</p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider shadow-sm transition-colors duration-300 border ${
              completedCount === TASK_ORDER.length ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-brand-50 text-brand-700 border-brand-200'
            }`}
          >
            {completedCount} / {TASK_ORDER.length} Done
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Day Summary Card with Gradient */}
        {!isFuture && (
          <div 
            className="rounded-3xl p-6 text-brand-950 relative overflow-hidden shadow-sm mb-2 border border-brand-500/10"
            style={{ background: 'linear-gradient(135deg, #F2F8F4 0%, #b4d8c0 100%)' }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-md pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/5 blur-xl pointer-events-none" />
            
            <div className="relative flex justify-between items-center">
              <div>
                <p className="text-brand-600 text-xs font-extrabold tracking-widest uppercase">Challenge Day</p>
                <h2 className="font-display font-extrabold text-2xl mt-0.5 text-brand-950">Day {dayNumber} Progress</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center font-bold shadow-inner-sm text-brand-950">
                {completedCount === TASK_ORDER.length ? (
                  <svg className="w-8 h-8 text-brand-600 shadow-[0_0_8px_rgba(132,180,156,0.2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-brand-600/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>

            <div className="relative mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-brand-950">
                <span>COMPLETED TASKS</span>
                <span className="font-mono">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2.5 bg-brand-500/15 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(132,180,156,0.35)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-brand-700 font-semibold pt-1">
                {completedCount === TASK_ORDER.length ? 'All daily tasks completed! Exceptional work.' : `Complete all ${TASK_ORDER.length} daily tasks to lock in this day.`}
              </p>
            </div>
          </div>
        )}

        {/* Challenge not started yet */}
        {!isChallengeStarted && (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm mt-6">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-gray-200 shadow-inner-sm text-gray-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-display font-extrabold text-gray-900 text-lg">Challenge has not started yet</p>
            {user.startDate ? (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  This day unlocks after the challenge starts on:
                </p>
                <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-100 rounded-2xl text-brand-500 font-bold text-sm font-mono">
                  {new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  Please go to Profile (Settings) page to start your challenge.
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
        )}

        {/* Day locked card */}
        {isChallengeStarted && isFuture && (
          <div className="bg-amber-50/90 border-2 border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-sm mt-6">
            <div className="w-14 h-14 bg-amber-100 border border-amber-300 rounded-2xl mx-auto flex items-center justify-center text-amber-700">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-gray-900 text-lg">Day {dayNumber} is Locked</h3>
              <p className="text-sm font-semibold text-amber-900 mt-1.5 leading-relaxed max-w-md mx-auto">
                Complete your previous day's Sleep Task to unlock today's tasks.
              </p>
            </div>
            {dayNumber > 1 && (
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs shadow-brand transition-all active:scale-95"
              >
                <span>Complete Day {dayNumber - 1} Sleep Task</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* List of Tasks */}
        {!isFuture && logs && (
          <div className="space-y-6">
            {!user.batchId && (
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm space-y-4">
                <div className="px-6 pt-5 flex justify-between items-center">
                  <div>
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100 uppercase tracking-wide">
                      Daily Class Video 📹
                    </span>
                    <h3 className="font-display font-extrabold text-sm text-gray-900 mt-1.5">
                      {PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-1 rounded">
                    Day {dayNumber} Video
                  </span>
                </div>
                
                <div className="aspect-video w-full bg-black relative">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].youtubeId}?rel=0&modestbranding=1`}
                    title={PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                <p className="text-xs text-gray-500 px-6 pb-5 leading-relaxed">
                  {PRE_RECORDED_VIDEOS[(dayNumber - 1) % 5].description}
                </p>
              </div>
            )}

            {/* Editable Tasks Section */}
            {editableTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                  <p className="text-xs font-extrabold text-brand-500 uppercase tracking-widest">Available to Log</p>
                </div>
                <div className="space-y-3">
                  {editableTasks.map((taskId) => (
                    <TaskCard
                      key={taskId}
                      taskId={taskId}
                      log={logMap[taskId]}
                      dayNumber={dayNumber}
                      currentDayNumber={currentDayNumber}
                      onTap={(tid) => setActiveTask(tid)}
                      readonly={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Read-Only Tasks Section */}
            {readonlyTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1 pt-2">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Finalized Tasks (Read-Only)</p>
                </div>
                <div className="space-y-3">
                  {readonlyTasks.map((taskId) => (
                    <TaskCard
                      key={taskId}
                      taskId={taskId}
                      log={logMap[taskId]}
                      dayNumber={dayNumber}
                      currentDayNumber={currentDayNumber}
                      readonly={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informative past day edit info */}
        {!isFuture && isPast && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center flex items-center justify-center gap-2 shadow-sm">
            <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 font-semibold">
              This challenge day has ended. All tasks are finalized and cannot be modified.
            </p>
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        title={
          activeTask ? (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-100" style={{ color: TASK_CONFIG[activeTask].color }}>
                {TASK_CONFIG[activeTask].icon}
              </span>
              <span className="text-gray-950 font-bold">
                {TASK_CONFIG[activeTask].name} · Day {dayNumber}
              </span>
            </div>
          ) : ''
        }
      >
        {ActiveComponent && (
          <ActiveComponent
            onSubmit={(data) => handleSubmit(activeTask, data)}
            existingLog={logMap[activeTask]}
            loading={loading}
            dayNumber={dayNumber}
          />
        )}
      </BottomSheet>
    </div>
  );
}
