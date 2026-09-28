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
      className={`w-full max-w-md sm:max-w-[440px] rounded-3xl transition-all duration-300 select-none overflow-hidden flex flex-col justify-between ${
        !isUnlocked
          ? 'bg-gray-100 border border-gray-200/80 shadow-xs opacity-60 cursor-pointer text-gray-700'
          : isActive
          ? 'bg-brand-500 text-white border-2 border-brand-400/60 shadow-xl ring-4 ring-brand-500/20 scale-100 opacity-100'
          : 'bg-brand-500 text-white border border-brand-400/50 shadow-md opacity-90 hover:opacity-100 cursor-pointer'
      }`}
    >
      {/* CARD TOP BANNER / HEADER */}
      <div
        className={`p-4 sm:p-5 border-b transition-colors ${
          !isUnlocked
            ? 'bg-gray-100/60 border-gray-200'
            : 'bg-black/5 border-white/15'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Day Count & Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`font-display font-black text-2xl sm:text-3xl leading-none tracking-tight ${
                !isUnlocked ? 'text-gray-400' : 'text-white'
              }`}
            >
              Day {dNum}
            </span>

            {isToday ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-brand-800 shadow-xs">
                Today
              </span>
            ) : isAllDone ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 shadow-xs">
                ✓ All Done
              </span>
            ) : !isUnlocked ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500">
                🔒 Locked
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/25">
                Day {dNum}/30
              </span>
            )}
          </div>

          {/* Completed count badge */}
          <div className="text-right">
            <span
              className={`inline-block font-mono text-xs font-black px-2.5 py-1 rounded-xl border ${
                !isUnlocked
                  ? 'bg-gray-200/60 border-gray-300 text-gray-400'
                  : isAllDone
                  ? 'bg-emerald-400/25 border-emerald-300 text-white'
                  : 'bg-black/15 border-white/20 text-white'
              }`}
            >
              {completedCount} / {TASK_ORDER.length} Done
            </span>
          </div>
        </div>

        {/* Day and Date */}
        <div className="mt-1 flex items-baseline justify-between">
          <p className={`text-xs sm:text-[13px] font-semibold ${!isUnlocked ? 'text-gray-500' : 'text-white/90'}`}>
            {weekdayLong}, {formattedDate}
          </p>
          <span className={`text-[11px] font-mono font-bold ${!isUnlocked ? 'text-gray-400' : 'text-white/90'}`}>
            {progressPercent}%
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div className={`mt-2.5 h-1.5 w-full rounded-full overflow-hidden ${!isUnlocked ? 'bg-gray-200/80' : 'bg-black/20'}`}>
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              !isUnlocked
                ? 'bg-gray-400'
                : isAllDone
                ? 'bg-emerald-300'
                : 'bg-white'
            }`}
            style={{ width: `${Math.max(progressPercent, isUnlocked ? 4 : 0)}%` }}
          />
        </div>
      </div>

      {/* CARD TASKS LIST */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        {/* If the whole card is locked (e.g. upcoming day) */}
        {!isUnlocked ? (
          <div className="py-8 px-4 text-center space-y-3 bg-gray-50/70 rounded-2xl border border-gray-200/60 my-auto">
            <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-2xl mx-auto flex items-center justify-center text-xl">
              🔒
            </div>
            <div>
              <p className="font-display font-extrabold text-sm text-gray-700">
                Day {dNum} is Locked
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto">
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
                className="p-3 rounded-2xl bg-white/95 border border-white/40 flex items-center justify-between gap-2.5 hover:bg-white active:scale-[0.98] transition-all cursor-pointer shadow-sm text-gray-900"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">🌙</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide leading-tight truncate">
                      Last Night's Sleep (Day {dNum - 1})
                    </p>
                    <p className="text-[10px] text-indigo-700 font-medium">
                      Unlocked at 3:00 AM · Tap to record sleep
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-[10px] shadow-brand flex-shrink-0 transition-colors">
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
                        ? 'bg-white/85 border-white/60 text-gray-700'
                        : taskLocked
                        ? 'bg-white/65 border-white/40 opacity-75 cursor-not-allowed text-gray-600'
                        : isDone
                        ? 'bg-white border-white/80 shadow-2xs hover:shadow-md active:scale-[0.99] cursor-pointer'
                        : 'bg-white border-white/80 shadow-2xs hover:shadow-md active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base shadow-2xs"
                        style={{
                          backgroundColor: taskLocked && !isDone ? '#f3f4f6' : cfg.color + '15',
                          color: taskLocked && !isDone ? '#9ca3af' : cfg.color,
                        }}
                      >
                        {cfg.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-display font-bold text-xs sm:text-[13px] text-gray-900 leading-tight truncate">
                            {cfg.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-mono font-extrabold ${
                              isDone ? 'text-brand-700' : 'text-gray-800'
                            }`}
                          >
                            {formatTaskAmount(taskId, log)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium truncate">
                            · {getTaskTargetText(taskId)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action / Status Badge */}
                    <div className="flex-shrink-0">
                      {taskLocked ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200/80">
                          <span>🔒</span>
                          <span className="hidden sm:inline">{lockReason}</span>
                        </div>
                      ) : isDone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                            ✓
                          </span>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-[10px] font-bold text-brand-700 transition-colors shadow-2xs"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-brand-500 hover:bg-brand-600 shadow-brand active:scale-95 transition-all flex items-center gap-1"
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
        className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-semibold ${
          !isUnlocked
            ? 'bg-gray-100/60 border-gray-200 text-gray-400'
            : 'bg-black/10 border-white/15 text-white/80'
        }`}
      >
        <span>eldroplus 30-Day Quest</span>
        {isUnlocked && (
          <span className="text-white font-bold">
            Tap any task to update measure →
          </span>
        )}
      </div>
    </div>
  );
}
