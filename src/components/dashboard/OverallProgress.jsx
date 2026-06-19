import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/dexie';
import { TASK_ORDER } from '../../utils/taskConfig';

const REQUIRED = ['yoga', 'meditation', 'water', 'protein'];

export default function OverallProgress({ currentDayNumber }) {
  const logs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!logs) return null;

  let completedDays = 0;
  for (let d = 1; d < currentDayNumber; d++) {
    const dayLogs = logs.filter((l) => l.dayNumber === d && l.completed);
    const taskIds = dayLogs.map((l) => l.taskId);
    if (REQUIRED.every((t) => taskIds.includes(t))) completedDays++;
  }

  const missedCount = (currentDayNumber - 1) - completedDays;
  const daysToGo = 30 - currentDayNumber + 1;

  return (
    <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-700 text-gray-900 text-sm">Overall Progress</h2>
        <span className="text-xs text-muted">{completedDays} / 30 days</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full bg-primary transition-all duration-700"
          style={{ width: `${(completedDays / 30) * 100}%` }}
        />
      </div>

      <div className="flex gap-3 text-center">
        <div className="flex-1">
          <p className="font-mono font-500 text-green-600 text-xl">{completedDays}</p>
          <p className="text-xs text-muted">Complete</p>
        </div>
        <div className="flex-1">
          <p className="font-mono font-500 text-gray-900 text-xl">{daysToGo}</p>
          <p className="text-xs text-muted">To go</p>
        </div>
        {missedCount > 0 && (
          <div className="flex-1">
            <p className="font-mono font-500 text-red-400 text-xl">{missedCount}</p>
            <p className="text-xs text-muted">Missed</p>
          </div>
        )}
      </div>
    </div>
  );
}
