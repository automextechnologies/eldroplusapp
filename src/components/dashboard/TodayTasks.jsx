import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import db from '../../db/dexie';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../../utils/taskConfig';
import { isTaskCompleted } from '../../utils/taskCompletion';
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

  const todayDate = formatDate();
  const logs = useLiveQuery(
    () => db.taskLogs.where('date').equals(todayDate).toArray(),
    [todayDate]
  );

  const logMap = {};
  logs?.forEach((l) => { logMap[l.taskId] = l; });

  const completedCount = TASK_ORDER.filter((t) => {
    const log = logMap[t];
    return isTaskCompleted(t, log, dayNumber, dayNumber);
  }).length;
  const progress = (completedCount / TASK_ORDER.length) * 100;

  async function handleSubmit(taskId, data) {
    setLoading(true);
    try {
      let completed = true;
      if (taskId === 'water' || taskId === 'protein') {
        completed = false;
      }

      const optimisticLog = {
        dayNumber,
        taskId,
        date: todayDate,
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

      if (completedCount + 1 === TASK_ORDER.length) {
        setTimeout(() => setConfetti(true), 300);
        setTimeout(() => setConfetti(false), 1000);
      }

      api.post('/api/tasks/log', { dayNumber, taskId, ...data, completed, date: todayDate })
        .catch(() => {
          db.syncQueue.add({
            endpoint: '/api/tasks/log',
            method: 'POST',
            body: { dayNumber, taskId, ...data, completed, date: todayDate },
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
          <span className="text-sm text-muted">{completedCount} / {TASK_ORDER.length} done</span>
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
