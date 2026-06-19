import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { formatDate } from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import BottomSheet from '../components/shared/BottomSheet';
import YogaTask from '../components/tasks/YogaTask';
import MeditationTask from '../components/tasks/MeditationTask';
import WaterTask from '../components/tasks/WaterTask';
import ProteinTask from '../components/tasks/ProteinTask';
import SleepTask from '../components/tasks/SleepTask';
import ConfettiEffect from '../components/shared/ConfettiEffect';

const TASK_COMPONENTS = {
  yoga: YogaTask,
  meditation: MeditationTask,
  water: WaterTask,
  protein: ProteinTask,
  sleep: SleepTask,
};

function TaskCard({ taskId, log, onTap, dayNumber }) {
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

  const descriptions = {
    yoga:       'Improves flexibility & reduces stress',
    meditation: 'Calms your mind & boosts focus',
    water:      'Stay hydrated, stay energized',
    protein:    'Build & repair muscle tissue',
    sleep:      'Rest & recover for tomorrow',
  };

  return (
    <button
      onClick={() => onTap(taskId)}
      className={`w-full text-left rounded-3xl p-5 border-2 transition-all duration-300 active:scale-[0.98] ${
        done
          ? 'bg-white border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
          : 'premium-card premium-card-hover'
      }`}
      style={done ? { borderColor: config.color + '30', boxShadow: `0 4px 20px ${config.color}15` } : {}}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300"
          style={{
            backgroundColor: done ? config.color : config.lightBg,
          }}
        >
          {config.icon}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-display font-bold text-base text-gray-900">{config.name}</p>
            {config.required && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600">Required</span>
            )}
          </div>
          <p className="text-xs text-muted">{done ? formatVal() : descriptions[taskId]}</p>
        </div>

        <div className="flex-shrink-0 pt-0.5">
          {done ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for water */}
      {taskId === 'water' && done && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Logged</span>
            <span style={{ color: config.color }}>{log.amount >= 1000 ? `${(log.amount/1000).toFixed(1)}L` : `${log.amount}ml`}</span>
          </div>
          <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((log.amount / 2500) * 100, 100)}%`, backgroundColor: config.color }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

export default function DailyTasks() {
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();
  const { cancelTaskReminders } = useNotifications();

  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const todayDate = formatDate();
  const logs = useLiveQuery(
    () => db.taskLogs.where('date').equals(todayDate).toArray(),
    [todayDate]
  );

  if (!user) return null;

  const logMap = {};
  logs?.forEach((l) => { logMap[l.taskId] = l; });
  const completedCount = TASK_ORDER.filter((t) => logMap[t]?.completed).length;
  const progressPercent = (completedCount / 5) * 100;

  async function handleSubmit(taskId, data) {
    setLoading(true);
    try {
      const optimisticLog = {
        dayNumber: currentDayNumber,
        taskId,
        date: todayDate,
        completed: true,
        amount: data.amount,
        unit: data.unit,
        completedAt: new Date().toISOString(),
        forDay: data.forDay,
      };
      const existing = await db.taskLogs.where({ dayNumber: currentDayNumber, taskId }).first();
      if (existing) await db.taskLogs.update(existing.id, optimisticLog);
      else await db.taskLogs.add(optimisticLog);

      cancelTaskReminders(taskId);
      setActiveTask(null);

      if (completedCount + 1 === 5) {
        setTimeout(() => { setConfetti(true); setTimeout(() => setConfetti(false), 100); }, 300);
      }

      api.post('/api/tasks/log', { dayNumber: currentDayNumber, taskId, ...data }).catch(() => {
        db.syncQueue.add({ endpoint: '/api/tasks/log', method: 'POST', body: { dayNumber: currentDayNumber, taskId, ...data }, createdAt: new Date() });
      });
    } finally {
      setLoading(false);
    }
  }

  const ActiveComponent = activeTask ? TASK_COMPONENTS[activeTask] : null;

  return (
    <>
      <ConfettiEffect trigger={confetti} />

      <div className="min-h-screen bg-surface md:p-4">
        {/* Header */}
        <div 
          className="px-5 pt-14 pb-16 md:py-10 md:rounded-3xl relative overflow-hidden mb-6"
          style={{ background: 'linear-gradient(135deg, #7A1E04 0%, #C83A0E 55%, #E84C1E 100%)' }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-md pointer-events-none" />
          <p className="relative text-white/70 text-sm font-medium">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h1 className="relative font-display font-extrabold text-2xl text-white mt-0.5">Day {currentDayNumber} Tasks</h1>

          {/* Circular progress */}
          <div className="relative flex items-center gap-5 mt-4">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 56 56" className="w-16 h-16 -rotate-90">
                <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5"/>
                <circle
                  cx="28" cy="28" r="23" fill="none"
                  stroke="white" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={`${2 * Math.PI * 23 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-sm text-white">{completedCount}/5</span>
              </div>
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight">
                {completedCount === 0 ? "Let's go!" :
                 completedCount < 3 ? 'Keep it up!' :
                 completedCount < 5 ? 'Almost there!' :
                 'All done!'}
              </p>
              <p className="text-white/85 text-sm font-semibold">{5 - completedCount} task{5 - completedCount !== 1 ? 's' : ''} remaining</p>
            </div>
          </div>
        </div>
 
        {/* Tasks Grid */}
        <div className="-mt-6 md:mt-0 bg-surface rounded-t-[2rem] md:rounded-none px-4 md:px-0 pt-6 pb-28 md:pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {TASK_ORDER.map((taskId) => (
            <TaskCard
              key={taskId}
              taskId={taskId}
              log={logMap[taskId]}
              dayNumber={currentDayNumber}
              onTap={(tid) => setActiveTask(tid)}
            />
          ))}
 
          {completedCount === 5 && (
            <div className="text-center py-6 md:col-span-2 lg:col-span-3 animate-scale-in">
              <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl mx-auto flex items-center justify-center mb-4 text-green-600 shadow-inner-sm">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138z" />
                </svg>
              </div>
              <p className="font-display font-bold text-xl text-gray-900">All tasks complete!</p>
              <p className="text-muted text-sm mt-1">Amazing work today. See you tomorrow!</p>
            </div>
          )}
        </div>
      </div>
 
      <BottomSheet
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        title={
          activeTask ? (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-50" style={{ color: TASK_CONFIG[activeTask].color }}>
                {TASK_CONFIG[activeTask].icon}
              </span>
              <span>{TASK_CONFIG[activeTask].name}</span>
            </div>
          ) : ''
        }
      >
        {ActiveComponent && (
          <ActiveComponent
            onSubmit={(data) => handleSubmit(activeTask, data)}
            existingLog={logMap[activeTask]}
            loading={loading}
            dayNumber={currentDayNumber}
          />
        )}
      </BottomSheet>
    </>
  );
}
