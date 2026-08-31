import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { isTaskCompleted } from '../utils/taskCompletion';

const REQUIRED = ['yoga', 'meditation', 'water', 'protein'];

export function useStreak(currentDayNumber) {
  const taskLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!taskLogs) return 0;

  let streak = 0;
  for (let d = currentDayNumber - 1; d >= 1; d--) {
    const dayLogs = taskLogs.filter((l) => l.dayNumber === d);
    const allDone = REQUIRED.every((task) => {
      const log = dayLogs.find((l) => l.taskId === task);
      return isTaskCompleted(task, log, d, currentDayNumber);
    });
    if (allDone) streak++;
    else break;
  }

  return streak;
}
