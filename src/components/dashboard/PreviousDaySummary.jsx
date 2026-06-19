import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/dexie';
import { TASK_ORDER, TASK_CONFIG } from '../../utils/taskConfig';

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

  const completedCount = TASK_ORDER.filter((t) => logMap[t]?.completed).length;

  function formatAmount(taskId, log) {
    if (!log?.completed) return '—';
    if (taskId === 'water') return log.amount >= 1000 ? `${(log.amount / 1000).toFixed(1)}L` : `${log.amount}ml`;
    if (taskId === 'yoga' || taskId === 'meditation') return `${log.amount} min`;
    if (taskId === 'protein') return `${log.amount}g`;
    if (taskId === 'sleep') return `${log.amount} hrs`;
    return `${log.amount} ${log.unit}`;
  }

  return (
    <div className="mx-4 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4"
      >
        <div>
          <p className="font-display font-700 text-gray-900 text-sm">Yesterday · Day {prevDay}</p>
          <p className="text-xs text-muted">{completedCount} of 5 tasks completed</p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {TASK_ORDER.map((taskId) => {
            const config = TASK_CONFIG[taskId];
            const log = logMap[taskId];
            return (
              <div key={taskId} className="flex items-center gap-3">
                <span className="text-gray-500">{config.icon}</span>
                <span className="flex-1 text-sm text-gray-700">{config.name}</span>
                <span
                  className={`text-sm font-mono font-500 ${log?.completed ? 'text-gray-900' : 'text-gray-300'}`}
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
