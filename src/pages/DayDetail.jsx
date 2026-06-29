import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { isDayUnlocked, getUnlockDate, formatDate, formatUnlockDate } from '../utils/dateUtils';
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

  if (!user) return null;

  const isUnlocked = isDayUnlocked(dayNumber, user.startDate);
  const isFuture = !isUnlocked;
  const isPast = isUnlocked && dayNumber < currentDayNumber;
  const isToday = isUnlocked && dayNumber === currentDayNumber;

  function isTaskReadonly(taskId) {
    if (isFuture) return true;
    if (isToday) return false;
    // It's a past day (dayNumber < currentDayNumber)
    if (dayNumber === currentDayNumber - 1 && taskId === 'sleep') {
      return false; // previous day's sleep is editable
    }
    return true; // all other past tasks are readonly
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
    : '';

  async function handleSubmit(taskId, data) {
    setLoading(true);
    try {
      const targetDate = (() => {
        const d = new Date(user.startDate);
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
        forDay: data.forDay,
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

  const progressPercent = (completedCount / 5) * 100;

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
              completedCount === 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-brand-50 text-brand-700 border-brand-200'
            }`}
          >
            {completedCount} / 5 Done
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Day Summary Card with Gradient */}
        {!isFuture && (
          <div 
            className="rounded-3xl p-6 text-brand-950 relative overflow-hidden shadow-sm mb-2 border border-brand-500/10"
            style={{ background: 'linear-gradient(135deg, #FFF0EB 0%, #FFE0D6 100%)' }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-md pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/5 blur-xl pointer-events-none" />
            
            <div className="relative flex justify-between items-center">
              <div>
                <p className="text-brand-600 text-xs font-extrabold tracking-widest uppercase">Challenge Day</p>
                <h2 className="font-display font-extrabold text-2xl mt-0.5 text-brand-950">Day {dayNumber} Progress</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center font-bold shadow-inner-sm text-brand-950">
                {completedCount === 5 ? (
                  <svg className="w-8 h-8 text-brand-600 shadow-[0_0_8px_rgba(232,76,30,0.1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(232,76,30,0.15)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-brand-700 font-semibold pt-1">
                {completedCount === 5 ? 'All daily tasks completed! Exceptional work.' : 'Complete all 5 daily tasks to lock in this day.'}
              </p>
            </div>
          </div>
        )}

        {/* Future day locked card */}
        {isFuture && (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm mt-6">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-gray-200 shadow-inner-sm text-gray-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="font-display font-extrabold text-gray-900 text-lg">Day {dayNumber} is locked</p>
            <p className="text-sm text-gray-500 mt-2">
              This wellness journey page unlocks on:
            </p>
            <p className="inline-block mt-3 px-4 py-2 bg-brand-50 border border-brand-100 rounded-2xl text-brand-500 font-bold text-sm font-mono">
              {formatUnlockDate(getUnlockDate(dayNumber, user.startDate))}
            </p>
          </div>
        )}

        {/* List of Tasks */}
        {!isFuture && logs && (
          <div className="space-y-6">
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
              {dayNumber === currentDayNumber - 1 
                ? "Only the previous night's sleep is editable on the day after. Other tasks are finalized."
                : "This challenge day has ended. All tasks are finalized and cannot be modified."}
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
