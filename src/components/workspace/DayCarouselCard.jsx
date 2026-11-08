import { format } from 'date-fns';
import { TASK_ORDER, TASK_CONFIG } from '../../utils/taskConfig';
import { isTaskCompleted } from '../../utils/taskCompletion';

export default function DayCarouselCard({
  day,
  logMap = {},
  currentDayNumber,
  isActive = false,
  onSelectTask,
  onCardClick,
  prevDaySleepLog = null,
  isPrevDaySleepUnlocked = false,
  isPrevDaySleepCompleted = false,
}) {
  const {
    dNum,
    totalDays = 30,
    date,
    formattedDate,
    weekdayLong,
    isUnlocked,
    isToday,
    isPast,
    isNextLocked,
    isNormalUnlocked,
    isSleepLocked,
    isSleepUnlocked,
    timings,
  } = day;

  // Calculate completion for this day
  const completedCount = TASK_ORDER.filter((tId) => {
    return isTaskCompleted(tId, logMap[tId], dNum, currentDayNumber);
  }).length;
  const isAllDone = completedCount === TASK_ORDER.length;
  const progressPercent = Math.round((completedCount / TASK_ORDER.length) * 100);

  function formatTaskAmount(taskId, log) {
    const amt = log?.amount !== undefined ? Number(log.amount) : 0;
    const cfg = TASK_CONFIG[taskId];
    if (amt <= 0) return `0 ${cfg?.unit || ''}`;
    if (taskId === 'water') {
      return amt >= 1000 ? `${(amt / 1000).toFixed(1)}L` : `${amt}ml`;
    }
    if (taskId === 'yoga' || taskId === 'meditation') {
      return `${amt} min`;
    }
    if (taskId === 'sleep') {
      return `${amt} hrs`;
    }
    return `${amt} ${cfg?.unit || ''}`;
  }

  function getTaskTargetText(taskId) {
    if (taskId === 'water') return 'Target: 2.5L';
    if (taskId === 'yoga') return 'Target: 15-60 min';
    if (taskId === 'meditation') return 'Target: 10-20 min';
    if (taskId === 'sleep') return 'Target: 7-9 hrs';
    return '';
  }

  // Handle task click
  function handleTaskItemClick(taskId, isLocked, lockReason) {
    if (!isUnlocked) {
      onCardClick && onCardClick(day);
      return;
    }
    if (isLocked) {
      onSelectTask && onSelectTask(dNum, taskId, logMap[taskId], { locked: true, reason: lockReason });
      return;
    }
    onSelectTask && onSelectTask(dNum, taskId, logMap[taskId], { locked: false });
  }

  return (
    <div
      onClick={() => onCardClick && onCardClick(day)}
      className={`w-full max-w-md sm:max-w-[440px] rounded-[26px] transition-all duration-300 select-none overflow-hidden flex flex-col justify-between ${
        !isUnlocked
          ? 'bg-[#F5F5F7] border border-black/[0.06] shadow-2xs opacity-65 cursor-pointer text-[#86868B]'
          : isActive
          ? 'bg-white text-[#1D1D1F] border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-2 ring-[#00A86B]/25 scale-100 opacity-100'
          : 'bg-white/80 text-[#1D1D1F] border border-black/[0.06] shadow-sm hover:shadow-md opacity-95 hover:opacity-100 cursor-pointer'
      }`}
    >
      {/* CARD TOP BANNER / HEADER */}
      <div
        className={`p-4 sm:p-5 border-b transition-colors ${
          !isUnlocked
            ? 'bg-black/[0.02] border-black/[0.05]'
            : 'bg-black/[0.015] border-black/[0.06]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Day Count & Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`font-display font-bold text-2xl sm:text-3xl leading-none tracking-tight ${
                !isUnlocked ? 'text-[#86868B]' : 'text-[#1D1D1F]'
              }`}
            >
              Day {dNum}
            </span>

            {isToday ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20 shadow-2xs">
                Today
              </span>
            ) : isAllDone ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 shadow-2xs">
                ✓ All Done
              </span>
            ) : !isUnlocked ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-black/[0.05] text-[#86868B]">
                🔒 Locked
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-black/[0.04] text-[#1D1D1F] border border-black/[0.06]">
                Day {dNum}/{totalDays}
              </span>
            )}
          </div>

          {/* Completed count badge */}
          <div className="text-right">
            <span
              className={`inline-block font-mono text-xs font-semibold px-2.5 py-1 rounded-full border ${
                !isUnlocked
                  ? 'bg-black/[0.03] border-black/[0.06] text-[#86868B]'
                  : isAllDone
                  ? 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]'
                  : 'bg-black/[0.04] border-black/[0.06] text-[#1D1D1F]'
              }`}
            >
              {completedCount} / {TASK_ORDER.length} Done
            </span>
          </div>
        </div>

        {/* Day and Date */}
        <div className="mt-1.5 flex items-baseline justify-between">
          <p className={`text-xs sm:text-[13px] font-medium ${!isUnlocked ? 'text-[#86868B]' : 'text-[#86868B]'}`}>
            {weekdayLong}, {formattedDate}
          </p>
        </div>
      </div>

      {/* CARD TASKS LIST */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        {/* If the whole card is locked (e.g. upcoming day) */}
        {!isUnlocked ? (
          <div className="py-8 px-4 text-center space-y-3 bg-black/[0.02] rounded-2xl border border-black/[0.05] my-auto">
            <div className="w-12 h-12 bg-black/[0.04] text-[#86868B] rounded-2xl mx-auto flex items-center justify-center text-xl">
              🔒
            </div>
            <div>
              <p className="font-display font-bold text-sm text-[#1D1D1F]">
                Day {dNum} is Locked
              </p>
              <p className="text-xs text-[#86868B] mt-1 max-w-[260px] mx-auto">
                {timings?.dayUnlockTime
                  ? `Unlocks automatically on ${format(timings.dayUnlockTime, 'MMM d')} at 3:00 AM.`
                  : 'Available once unlocked according to challenge schedule.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Convenient Banner for Yesterday's Sleep if Today & Day > 1 & not done */}
            {isToday && dNum > 1 && !isPrevDaySleepCompleted && isPrevDaySleepUnlocked && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTask && onSelectTask(dNum - 1, 'sleep', prevDaySleepLog, { locked: false });
                }}
                className="p-3 rounded-2xl bg-[#5856D6]/[0.06] border border-[#5856D6]/15 flex items-center justify-between gap-2.5 hover:bg-[#5856D6]/[0.1] active:scale-[0.98] transition-all cursor-pointer shadow-2xs text-[#1D1D1F]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">🌙</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#5856D6] uppercase tracking-wide leading-tight truncate">
                      Last Night's Sleep (Day {dNum - 1})
                    </p>
                    <p className="text-[10px] text-[#86868B] font-medium">
                      Unlocked at 3:00 AM · Tap to record sleep
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#00A86B] hover:bg-[#00915C] text-white font-semibold text-[10px] shadow-sm flex-shrink-0 transition-colors">
                  + Log Sleep
                </span>
              </div>
            )}

            {/* Core Daily Tasks */}
            <div className="space-y-2">
              {TASK_ORDER.map((taskId) => {
                const cfg = TASK_CONFIG[taskId];
                const log = logMap[taskId];
                const isDone = isTaskCompleted(taskId, log, dNum, currentDayNumber);

                // Specific task lock rules
                let taskLocked = false;
                let lockReason = '';

                if (taskId === 'sleep') {
                  if (dNum === currentDayNumber) {
                    // Current day's sleep unlocks tomorrow morning at 3:00 AM
                    taskLocked = true;
                    lockReason = 'Unlocks tomorrow at 3:00 AM';
                  } else if (isSleepLocked) {
                    taskLocked = true;
                    lockReason = isDone ? 'Completed & Locked' : 'Locked';
                  }
                } else {
                  // Normal tasks: locked after 1:00 AM of following day
                  if (!isNormalUnlocked && isPast) {
                    taskLocked = true;
                    lockReason = 'Locked at 1:00 AM';
                  }
                }

                return (
                  <div
                    key={taskId}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskItemClick(taskId, taskLocked, lockReason);
                    }}
                    className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      taskLocked && isDone
                        ? 'bg-black/[0.02] border-black/[0.05] text-[#86868B]'
                        : taskLocked
                        ? 'bg-black/[0.015] border-black/[0.04] opacity-75 cursor-not-allowed text-[#86868B]'
                        : isDone
                        ? 'bg-white border-black/[0.06] shadow-2xs hover:shadow-sm active:scale-[0.99] cursor-pointer'
                        : 'bg-white border-black/[0.06] shadow-2xs hover:shadow-sm active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                        style={{
                          backgroundColor: taskLocked && !isDone ? '#f3f4f6' : cfg.color + '15',
                          color: taskLocked && !isDone ? '#9ca3af' : cfg.color,
                        }}
                      >
                        {cfg.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-display font-semibold text-xs sm:text-[13px] text-[#1D1D1F] leading-tight truncate">
                            {cfg.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-mono font-semibold ${
                              isDone ? 'text-[#34C759]' : 'text-[#1D1D1F]'
                            }`}
                          >
                            {formatTaskAmount(taskId, log)}
                          </span>
                          <span className="text-[10px] text-[#86868B] font-medium truncate">
                            · {getTaskTargetText(taskId)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action / Status Badge */}
                    <div className="flex-shrink-0">
                      {taskLocked ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] text-[#86868B] text-[10px] font-medium border border-black/[0.05]">
                          <span>🔒</span>
                          <span className="hidden sm:inline">{lockReason}</span>
                        </div>
                      ) : isDone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-[#34C759] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                            ✓
                          </span>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-full border border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-[10px] font-semibold text-[#1D1D1F] transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-full font-semibold text-xs text-white bg-[#00A86B] hover:bg-[#00915C] shadow-[0_2px_8px_rgba(0,168,107,0.25)] active:scale-95 transition-all flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>Log</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CARD FOOTER INFO */}
      <div
        className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-medium ${
          !isUnlocked
            ? 'bg-black/[0.02] border-black/[0.05] text-[#86868B]'
            : 'bg-black/[0.02] border-black/[0.05] text-[#86868B]'
        }`}
      >
        <span>eldroplus {totalDays}-Day Quest</span>
        {isUnlocked && (
          <span className="text-[#00A86B] font-semibold">
            Tap any task to update measure →
          </span>
        )}
      </div>
    </div>
  );
}
