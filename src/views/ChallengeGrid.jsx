import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { isDayUnlocked, getUnlockDate, formatUnlockDate } from '../utils/dateUtils';
import ProgressRing from '../components/shared/ProgressRing';

import { TASK_ORDER } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';

function getDayStatus(dayNumber, logs, startDate, currentDayNumber) {
  if (!isDayUnlocked(dayNumber, startDate)) return 'locked';
  if (!isDayUnlocked(1, startDate)) return 'locked';
  if (dayNumber > 1) {
    for (let prev = 1; prev < dayNumber; prev++) {
      const hasSleep = logs.some((l) => l.dayNumber === prev && l.taskId === 'sleep' && l.completed);
      if (!hasSleep) return 'locked';
    }
  }
  const dayLogs = logs.filter((l) => l.dayNumber === dayNumber);
  const completedCount = TASK_ORDER.filter((taskId) => {
    const log = dayLogs.find((l) => l.taskId === taskId);
    return isTaskCompleted(taskId, log, dayNumber, currentDayNumber);
  }).length;
  const allDone = completedCount === TASK_ORDER.length;

  if (dayNumber === currentDayNumber) return allDone ? 'complete' : completedCount > 0 ? 'partial' : 'today';
  if (dayNumber < currentDayNumber) return allDone ? 'complete' : completedCount > 0 ? 'partial' : 'missed';
  return 'unlocked';
}

function DayBox({ dayNumber, status, progress, startDate, currentDayNumber }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  function handleTap() {
    if (status === 'locked') {
      const unlockDate = getUnlockDate(dayNumber, startDate);
      setToast(`Day ${dayNumber} unlocks on ${formatUnlockDate(unlockDate)}`);
      setToast("Complete your previous day's Sleep Task to unlock today's tasks.");
      setTimeout(() => setToast(''), 2500);
      return;
    }
    navigate(`/day/${dayNumber}`);
  }

  const statusStyles = {
    locked:   'bg-black/[0.03] text-[#86868B] border border-black/[0.05]',
    unlocked: 'bg-white border border-black/[0.08] text-[#1D1D1F] shadow-2xs',
    today:    'bg-white border-2 border-[#00A86B] text-[#00A86B] shadow-sm',
    partial:  'bg-white border border-black/[0.08] text-[#1D1D1F] shadow-2xs',
    complete: 'bg-[#34C759] text-white border-none shadow-2xs',
    missed:   'bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 text-[#FF3B30]',
  };

  return (
    <div className="relative">
      <button
        onClick={handleTap}
        className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 ${statusStyles[status]}`}
      >
        {status === 'locked' && (
          <svg className="w-3.5 h-3.5 mb-0.5 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        )}
        {status === 'complete' && (
          <svg className="w-4 h-4 mb-0.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'missed' && (
          <svg className="w-3 h-3 mb-0.5 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {status === 'partial' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ProgressRing progress={progress} size={36} strokeWidth={3} />
          </div>
        )}
        {status === 'today' && (
          <span className="text-[8px] font-bold absolute top-1.5 left-0 right-0 text-center text-[#00A86B] tracking-wider">
            TODAY
          </span>
        )}
        <span className={`font-display font-bold text-xs ${status === 'partial' ? 'relative z-10 bg-white/90 px-1 rounded-md' : ''}`}>
          {dayNumber}
        </span>
      </button>
      {toast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1D1D1F]/90 backdrop-blur-md text-white text-xs rounded-full px-3.5 py-1.5 whitespace-nowrap z-50 border border-white/10 shadow-lg font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function ChallengeGrid() {
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const totalDays = useUserStore((s) => s.getTotalDays)();
  const logs = useLiveQuery(() => db.taskLogs.toArray(), []);

  if (!user || !logs) {
    return (
      <div className="px-4 pt-6">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalDays }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  let completedDays = 0;
  const daysData = Array.from({ length: totalDays }, (_, i) => {
    const dayNumber = i + 1;
    const status = getDayStatus(dayNumber, logs, user.startDate, currentDayNumber);
    const dayLogs = logs.filter((l) => l.dayNumber === dayNumber);
    const completedCount = TASK_ORDER.filter((taskId) => {
      const log = dayLogs.find((l) => l.taskId === taskId);
      return isTaskCompleted(taskId, log, dayNumber, currentDayNumber);
    }).length;
    const progress = (completedCount / TASK_ORDER.length) * 100;
    if (status === 'complete') completedDays++;
    return { dayNumber, status, progress };
  });

  const isChallengeStarted = user.batchId ? (user.startDate ? isDayUnlocked(1, user.startDate) : false) : !!user.challengeStarted;

  return (
    <div className="min-h-screen bg-surface md:p-4 pb-12">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl rounded-none md:rounded-3xl border-t-0 border-x-0 md:border border-black/[0.06] mb-6 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5">
          <h1 className="font-display font-bold text-xl text-[#1D1D1F] tracking-tight">Your {totalDays}-Day Journey</h1>
          <p className="text-xs text-[#86868B] mt-0.5 font-medium">
            {isChallengeStarted ? (
              `${completedDays} days completed · ${Math.max(0, totalDays - currentDayNumber + 1)} days to go`
            ) : (
              user.startDate ? (
                `Starts on ${new Date(user.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              ) : (
                "Please go to Profile (Settings) page to start your challenge"
              )
            )}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-10 md:gap-3">
          {daysData.map(({ dayNumber, status, progress }) => (
            <DayBox
              key={dayNumber}
              dayNumber={dayNumber}
              status={status}
              progress={progress}
              startDate={user.startDate}
              currentDayNumber={currentDayNumber}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
