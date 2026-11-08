import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/dexie';
import { TASK_ORDER, TASK_CONFIG } from '../../utils/taskConfig';
import { isTaskCompleted } from '../../utils/taskCompletion';

export default function PreviousDaySummary({ currentDayNumber }) {
  const [expanded, setExpanded] = useState(false);
  const prevDay = currentDayNumber - 1;

  const logs = useLiveQuery(
    () => prevDay >= 1 ? db.taskLogs.where('dayNumber').equals(prevDay).toArray() : Promise.resolve([]),
    [prevDay]
  );

  if (currentDayNumber <= 1 || !logs) return null;

  const logMap = {};
  logs.forEach((l) => { logMap[l.taskId] = l; });

  const completedCount = TASK_ORDER.filter((t) => {
    const log = logMap[t];
    return isTaskCompleted(t, log, prevDay, currentDayNumber);
  }).length;

  function formatAmount(taskId, log) {
    const isCompleted = isTaskCompleted(taskId, log, prevDay, currentDayNumber);
    if (!isCompleted) return '—';
    if (taskId === 'water') return log.amount >= 1000 ? `${(log.amount / 1000).toFixed(1)}L` : `${log.amount}ml`;
    if (taskId === 'yoga' || taskId === 'meditation') return `${log.amount} min`;
    if (taskId === 'protein') return `${log.amount}g`;
    if (taskId === 'sleep') return `${log.amount} hrs`;
    return `${log.amount} ${log.unit}`;
  }

  return (
    <div className="mx-4 bg-white rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.06] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] transition-colors"
      >
        <div className="text-left">
          <p className="font-display font-bold text-[#1D1D1F] text-sm tracking-tight">Yesterday · Day {prevDay}</p>
          <p className="text-xs text-[#86868B] font-medium mt-0.5">{completedCount} of {TASK_ORDER.length} tasks completed</p>
        </div>
        <svg
          className={`w-4 h-4 text-[#86868B] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-black/[0.06] pt-3">
          {TASK_ORDER.map((taskId) => {
            const config = TASK_CONFIG[taskId];
            const log = logMap[taskId];
            return (
              <div key={taskId} className="flex items-center gap-3">
                <span className="text-base">{config.icon}</span>
                <span className="flex-1 text-xs font-semibold text-[#1D1D1F]">{config.name}</span>
                <span
                  className={`text-xs font-mono font-semibold ${isTaskCompleted(taskId, log, prevDay, currentDayNumber) ? 'text-[#34C759]' : 'text-[#86868B]'}`}
                >
                  {formatAmount(taskId, log)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
