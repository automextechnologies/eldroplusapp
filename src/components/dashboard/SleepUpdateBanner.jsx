import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/dexie';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/dateUtils';
import BottomSheet from '../shared/BottomSheet';
import SleepTask from '../tasks/SleepTask';
import { TASK_CONFIG } from '../../utils/taskConfig';

export default function SleepUpdateBanner({ currentDayNumber }) {
  const [dismissed, setDismissed] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const yesterdayDayNumber = currentDayNumber - 1;

  const yesterdaySleepLog = useLiveQuery(
    () =>
      yesterdayDayNumber >= 1
        ? db.taskLogs.where({ dayNumber: yesterdayDayNumber, taskId: 'sleep' }).first()
        : Promise.resolve(null),
    [yesterdayDayNumber]
  );

  const shouldShow =
    currentDayNumber > 1 &&
    !dismissed &&
    yesterdaySleepLog !== undefined &&
    !yesterdaySleepLog?.completed;

  async function handleSleepSubmit(data) {
    setLoading(true);
    try {
      const existing = await db.taskLogs
        .where({ dayNumber: yesterdayDayNumber, taskId: 'sleep' })
        .first();

      const logData = {
        dayNumber: yesterdayDayNumber,
        taskId: 'sleep',
        date: formatDate(),
        completed: true,
        amount: data.amount,
        unit: data.unit,
        forDay: yesterdayDayNumber,
        completedAt: new Date().toISOString(),
      };

      if (existing) {
        await db.taskLogs.update(existing.id, logData);
      } else {
        await db.taskLogs.add(logData);
      }

      api.post('/api/tasks/log', {
        dayNumber: yesterdayDayNumber,
        taskId: 'sleep',
        ...data,
        forDay: yesterdayDayNumber,
      }).catch(() => {});

      setShowSheet(false);
    } finally {
      setLoading(false);
    }
  }

  if (!shouldShow) return null;

  return (
    <>
      <div className="mx-4">
        <div className="bg-[#5856D6]/[0.06] border border-[#5856D6]/15 rounded-[22px] p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-[#5856D6]/15 text-[#5856D6] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-[#1D1D1F] text-sm">Log last night's sleep</p>
            <p className="text-xs text-[#86868B] mt-0.5 font-medium">It counts for your Day {yesterdayDayNumber} streak</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSheet(true)}
              className="px-3.5 py-1.5 bg-[#00A86B] hover:bg-[#00915C] text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              Log
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-indigo-600">{TASK_CONFIG.sleep.icon}</span>
            <span>Sleep · Night of Day {yesterdayDayNumber}</span>
          </div>
        }
      >
        <SleepTask
          onSubmit={handleSleepSubmit}
          existingLog={yesterdaySleepLog}
          loading={loading}
          dayNumber={yesterdayDayNumber}
        />
      </BottomSheet>
    </>
  );
}
