import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/dexie';
import { TASK_CONFIG } from '../../utils/taskConfig';

const STATS = [
  { taskId: 'yoga',       label: 'Yoga & Fitness', format: (v) => `${v}min` },
  { taskId: 'meditation', label: 'Meditation', format: (v) => `${v}min` },
  { taskId: 'water',      label: 'Water',      format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${v}ml` },
  { taskId: 'sleep',      label: 'Avg Sleep',  format: (v) => `${v.toFixed(1)}h`, avg: true },
];

export default function CumulativeStats() {
  const logs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!logs) return (
    <div className="px-4">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {STATS.map((s) => (
          <div key={s.taskId} className="skeleton flex-shrink-0 w-24 h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );

  function getStat(taskId, avg = false) {
    const taskLogs = logs.filter((l) => l.taskId === taskId && l.amount > 0);
    if (taskLogs.length === 0) return 0;
    const total = taskLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
    return avg ? total / taskLogs.length : total;
  }

  return (
    <div className="px-4">
      <h2 className="font-display font-bold text-[#1D1D1F] text-base mb-3 tracking-tight">So Far</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {STATS.map((s) => {
          const value = getStat(s.taskId, s.avg);
          const config = TASK_CONFIG[s.taskId];
          return (
            <div
              key={s.taskId}
              className="flex-shrink-0 bg-white rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.06] min-w-[90px] flex flex-col items-center hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 bg-black/[0.03]" style={{ color: config?.color }}>
                {config?.icon}
              </div>
              <p className="font-mono font-semibold text-[#1D1D1F] text-sm">
                {value === 0 ? '—' : s.format(value)}
              </p>
              <p className="text-[10px] text-[#86868B] font-semibold mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
