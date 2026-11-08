import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/dexie';
import { isTaskCompleted } from '../../utils/taskCompletion';
import { useUserStore } from '../../store/useUserStore';

const REQUIRED = ['yoga', 'meditation', 'water'];

export default function OverallProgress({ currentDayNumber }) {
  const totalDays = useUserStore((s) => s.getTotalDays)();
  const logs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!logs) return null;

  let completedDays = 0;
  for (let d = 1; d < currentDayNumber; d++) {
    const dayLogs = logs.filter((l) => l.dayNumber === d);
    const allDone = REQUIRED.every((t) => {
      const log = dayLogs.find((l) => l.taskId === t);
      return isTaskCompleted(t, log, d, currentDayNumber);
    });
    if (allDone) completedDays++;
  }

  const missedCount = (currentDayNumber - 1) - completedDays;
  const daysToGo = Math.max(0, totalDays - currentDayNumber + 1);

  return (
    <div className="mx-4 bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-[#1D1D1F] text-sm tracking-tight">Overall Progress</h2>
        <span className="text-xs text-[#86868B] font-semibold">{completedDays} / {totalDays} days</span>
      </div>

      <div className="flex gap-3 text-center">
        <div className="flex-1">
          <p className="font-mono font-bold text-[#34C759] text-xl">{completedDays}</p>
          <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider mt-0.5">Complete</p>
        </div>
        <div className="flex-1">
          <p className="font-mono font-bold text-[#1D1D1F] text-xl">{daysToGo}</p>
          <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider mt-0.5">To go</p>
        </div>
        {missedCount > 0 && (
          <div className="flex-1">
            <p className="font-mono font-bold text-[#FF3B30] text-xl">{missedCount}</p>
            <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider mt-0.5">Missed</p>
          </div>
        )}
      </div>
    </div>
  );
}
