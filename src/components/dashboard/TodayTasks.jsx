import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import db from '../../db/dexie';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../../utils/taskConfig';
import TaskCard from '../shared/TaskCard';
import BottomSheet from '../shared/BottomSheet';
import YogaTask from '../tasks/YogaTask';
import MeditationTask from '../tasks/MeditationTask';
import WaterTask from '../tasks/WaterTask';
import ProteinTask from '../tasks/ProteinTask';
import SleepTask from '../tasks/SleepTask';
import ConfettiEffect from '../shared/ConfettiEffect';

const TASK_COMPONENTS = {
  yoga: YogaTask,
  meditation: MeditationTask,
  water: WaterTask,
  protein: ProteinTask,
  sleep: SleepTask,
};

export default function TodayTasks({ dayNumber }) {
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const api = useApi();
  const { cancelTaskReminders } = useNotifications();

  const todayDate = formatDate();
  const logs = useLiveQuery(
    () => db.taskLogs.where('date').equals(todayDate).toArray(),
    [todayDate]
  );

  const logMap = {};
  logs?.forEach((l) => { logMap[l.taskId] = l; });

  const completedCount = TASK_ORDER.filter((t) => logMap[t]?.completed).length;
  const progress = (completedCount / 5) * 100;

  async function handleSubmit(taskId, data) {
    setLoading(true);
    try {
      const optimisticLog = {
        dayNumber,
        taskId,
        date: todayDate,
        completed: true,
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

      cancelTaskReminders(taskId);
      setActiveTask(null);

      if (completedCount + 1 === 5) {
        setTimeout(() => setConfetti(true), 300);
        setTimeout(() => setConfetti(false), 1000);
      }

      api.post('/api/tasks/log', { dayNumber, taskId, ...data })
        .catch(() => {
          db.syncQueue.add({
            endpoint: '/api/tasks/log',
            method: 'POST',
            body: { dayNumber, taskId, ...data },
            createdAt: new Date(),
          });
        });
    } finally {
      setLoading(false);
    }
  }

  const ActiveComponent = activeTask ? TASK_COMPONENTS[activeTask] : null;

  return (
    <>
      <ConfettiEffect trigger={confetti} />

      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-700 text-gray-900">Today's Tasks</h2>
          <span className="text-sm text-muted">{completedCount} / 5 done</span>
        </div>

        <div className="flex gap-1 mb-4">
          {TASK_ORDER.map((taskId) => {
            const config = TASK_CONFIG[taskId];
            const done = logMap[taskId]?.completed;
            return (
              <div
                key={taskId}
                className="flex-1 h-2 rounded-full transition-all duration-500"
                style={{ backgroundColor: done ? config.color : '#e2e8f0' }}
              />
            );
          })}
        </div>

        {TASK_ORDER.map((taskId) => (
          <TaskCard
            key={taskId}
            taskId={taskId}
            log={logMap[taskId]}
            dayNumber={dayNumber}
            onTap={(tid) => setActiveTask(tid)}
          />
        ))}
      </div>

      <BottomSheet
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        title={activeTask ? `${TASK_CONFIG[activeTask].icon} ${TASK_CONFIG[activeTask].name} · Day ${dayNumber}` : ''}
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
    </>
  );
}
