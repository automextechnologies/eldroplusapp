import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';

const REQUIRED = ['yoga', 'meditation', 'water', 'protein'];

export function useStreak(currentDayNumber) {
  const taskLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!taskLogs) return 0;

  let streak = 0;
  for (let d = currentDayNumber - 1; d >= 1; d--) {
    const dayLogs = taskLogs.filter((l) => l.dayNumber === d && l.completed);
    const dayTaskIds = dayLogs.map((l) => l.taskId);
    const allDone = REQUIRED.every((task) => dayTaskIds.includes(task));
    if (allDone) streak++;
    else break;
  }

  return streak;
}
