import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import {
  getDayTimings,
  isDayBlockUnlocked,
  isNormalTasksUnlocked,
  isSleepTaskUnlocked,
  isSleepTaskCompleted,
  isSleepTaskLocked,
  formatUnlockDate,
} from '../utils/dateUtils';
import { TASK_ORDER, TASK_CONFIG } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import DayCarouselCard from '../components/workspace/DayCarouselCard';
import TaskMeasureModal from '../components/workspace/TaskMeasureModal';

export default function DailyTasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useUserStore((s) => s.user);
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();
  const api = useApi();

  const allLogs = useLiveQuery(() => db.taskLogs.toArray(), []);

  // Toast feedback state
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 3000);
  };

  // Carousel Active Day
  // Requirement: "the current day card is the dafault card on the screen."
  const initialDay = useMemo(() => {
    const qDay = parseInt(searchParams.get('day'), 10);
    if (!isNaN(qDay) && qDay >= 1 && qDay <= currentDayNumber) {
      return qDay;
    }
    return Math.max(1, Math.min(currentDayNumber, 30));
  }, [searchParams, currentDayNumber]);

  const [activeDay, setActiveDay] = useState(initialDay);

  // Sync activeDay if currentDayNumber changes
  useEffect(() => {
    if (!searchParams.get('day')) {
      setActiveDay(Math.max(1, Math.min(currentDayNumber, 30)));
    }
  }, [currentDayNumber, searchParams]);

  // Modal State for updating measures
  // Requirement: "when selecting a task from card to update, a popup is created to add the measures."
  // "dont use any default values for new taks. start with zero."
  const [modalState, setModalState] = useState({
    isOpen: false,
    dayNumber: null,
    taskId: null,
    existingLog: null,
    dateFormatted: '',
  });
  const [savingTask, setSavingTask] = useState(false);

  // Challenge Start Check
  const isChallengeStarted = user?.startDate
    ? isDayBlockUnlocked(1, user.startDate)
    : (user?.batchId ? false : !!user?.challengeStarted);

  // Generate all 30 days data
  const { daysList, overallStats } = useMemo(() => {
    if (!user) return { daysList: [], overallStats: { completedDays: 0, progressPct: 0 } };

    const startDate = (() => {
      if (user.startDate) {
        const d = new Date(user.startDate);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    })();
    startDate.setHours(0, 0, 0, 0);

    const logs = allLogs || [];
    let completedDaysCount = 0;

    const list = Array.from({ length: 30 }, (_, i) => {
      const dNum = i + 1;
      const date = addDays(startDate, i);
      const isUnlocked = isDayBlockUnlocked(dNum, user.startDate);
      const isToday = dNum === currentDayNumber;
      const isPast = dNum < currentDayNumber;
      const isNextLocked = dNum > currentDayNumber;

      const dLogs = logs.filter((l) => Number(l.dayNumber) === dNum);
      const logMap = {};
      dLogs.forEach((l) => {
        logMap[l.taskId] = l;
      });

      // Task status
      const taskStatus = {};
      TASK_ORDER.forEach((taskId) => {
        taskStatus[taskId] = isTaskCompleted(taskId, logMap[taskId], dNum, currentDayNumber);
      });

      const completedCount = TASK_ORDER.filter((tId) => taskStatus[tId]).length;
      const isAllDone = completedCount === TASK_ORDER.length;
      if (isAllDone) completedDaysCount++;

      const timings = getDayTimings(dNum, user.startDate);
      const isNormalUnlocked = isNormalTasksUnlocked(dNum, user.startDate);
      const isSleepUnlocked = isSleepTaskUnlocked(dNum, user.startDate);
      const isSleepLocked = isSleepTaskLocked(dNum, user.startDate, logMap['sleep']);

      return {
        dNum,
        date,
        dayOfMonth: format(date, 'd'),
        monthName: format(date, 'MMM'),
        formattedDate: format(date, 'MMMM d, yyyy'),
        shortDate: format(date, 'MMM d'),
        weekdayLong: format(date, 'EEEE'),
        weekdayShort: format(date, 'EEE'),
        isUnlocked,
        isToday,
        isPast,
        isNextLocked,
        logMap,
        taskStatus,
        completedCount,
        isAllDone,
        timings,
        isNormalUnlocked,
        isSleepUnlocked,
        isSleepLocked,
      };
    });

    const progressPct = Math.round((completedDaysCount / 30) * 100);

    return {
      daysList: list,
      overallStats: {
        completedDays: completedDaysCount,
        progressPct,
      },
    };
  }, [user, allLogs, currentDayNumber]);

  // Yesterday sleep info for Day >= 2
  const prevDayNum = activeDay - 1;
  const prevDaySleepLog = useMemo(() => {
    if (activeDay <= 1 || !allLogs) return null;
    return allLogs.find((l) => Number(l.dayNumber) === prevDayNum && l.taskId === 'sleep');
  }, [allLogs, activeDay, prevDayNum]);

  const isPrevDaySleepUnlocked = useMemo(() => {
    if (activeDay <= 1) return false;
    return isSleepTaskUnlocked(prevDayNum, user?.startDate);
  }, [activeDay, prevDayNum, user?.startDate]);

  const isPrevDaySleepCompleted = useMemo(() => {
    return isSleepTaskCompleted(prevDaySleepLog);
  }, [prevDaySleepLog]);

  // Carousel Container and Drag State
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  // Navigation handlers with strict rules:
  // Requirement: "no rightside swipe to next day cards. the current day card is basd on the exisiting logic of task unloack. only left swipe to see previos day cards."
  function handleGoToPreviousDay() {
    if (activeDay > 1) {
      setActiveDay(activeDay - 1);
    }
  }

  function handleGoToNextDay() {
    if (activeDay < currentDayNumber) {
      setActiveDay(activeDay + 1);
    } else {
      // Trying to go beyond current unlocked day
      const nextDay = activeDay + 1;
      const dayData = daysList[nextDay - 1];
      const unlockMsg = dayData?.timings?.dayUnlockTime
        ? `Day ${nextDay} unlocks on ${formatUnlockDate(dayData.timings.dayUnlockTime)}`
        : `Day ${nextDay} is locked.`;
      showToast(unlockMsg, 'lock');
    }
  }

  function handleCardClick(clickedDay) {
    if (clickedDay.dNum === activeDay) return;

    if (clickedDay.dNum > currentDayNumber) {
      const unlockMsg = clickedDay?.timings?.dayUnlockTime
        ? `Day ${clickedDay.dNum} unlocks on ${formatUnlockDate(clickedDay.timings.dayUnlockTime)}`
        : `Day ${clickedDay.dNum} is locked.`;
      showToast(unlockMsg, 'lock');
      return;
    }

    setActiveDay(clickedDay.dNum);
  }

  // Touch Swipe Handlers (Mobile touch + pointer drag)
  function handleTouchStart(e) {
    dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY;
    setDragOffset(0);
    isHorizontalSwipe.current = false;
    setIsDragging(true);
  }

  function handleTouchMove(e) {
    if (!isDragging) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = currentX - dragStartX.current;
    const deltaY = currentY - dragStartY.current;

    // Detect horizontal swipe intention vs vertical page scroll
    if (!isHorizontalSwipe.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        isHorizontalSwipe.current = true;
      } else if (Math.abs(deltaY) > 10) {
        setIsDragging(false);
        setDragOffset(0);
        return;
      }
    }

    if (isHorizontalSwipe.current) {
      if (e.cancelable && e.touches) {
        e.preventDefault();
      }

      // Boundary constraints:
      // If at currentDayNumber and user drags finger left (trying to view next locked day):
      // Apply strict dampening / resistance!
      if (activeDay >= currentDayNumber && deltaX < 0) {
        setDragOffset(deltaX * 0.12);
      } else if (activeDay <= 1 && deltaX > 0) {
        setDragOffset(deltaX * 0.12);
      } else {
        setDragOffset(deltaX);
      }
    }
  }

  function handleTouchEnd() {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaX = dragOffset;
    setDragOffset(0);
    const swipeThreshold = 45; // pixels to trigger slide

    if (deltaX > swipeThreshold) {
      // User dragged finger right -> view previous day card
      if (activeDay > 1) {
        setActiveDay((prev) => prev - 1);
      }
    } else if (deltaX < -swipeThreshold) {
      // User dragged finger left -> view next day card
      if (activeDay < currentDayNumber) {
        setActiveDay((prev) => prev + 1);
      } else {
        // Blocked!
        const nextDay = activeDay + 1;
        const dayData = daysList[nextDay - 1];
        const unlockMsg = dayData?.timings?.dayUnlockTime
          ? `Day ${nextDay} unlocks on ${formatUnlockDate(dayData.timings.dayUnlockTime)}`
          : `Day ${nextDay} is locked.`;
        showToast(unlockMsg, 'lock');
      }
    }
  }

  // Open modal popup when user taps a task from a card
  function handleSelectTask(targetDayNum, taskId, currentLog, status = {}) {
    if (status.locked) {
      showToast(status.reason || `Task locked for Day ${targetDayNum}`, 'lock');
      return;
    }

    const dayItem = daysList[targetDayNum - 1];
    setModalState({
      isOpen: true,
      dayNumber: targetDayNum,
      taskId,
      existingLog: currentLog,
      dateFormatted: dayItem ? `${dayItem.weekdayLong}, ${dayItem.formattedDate}` : `Day ${targetDayNum}`,
    });
  }

  // Handle saving the measure from the popup modal
  // Requirement: "on the popup field to add the numbers and a button to update the value. that value is saved ."
  async function handleSaveMeasure(targetDayNum, taskId, data) {
    setSavingTask(true);
    try {
      const dayItem = daysList[targetDayNum - 1];
      const targetDate = dayItem ? format(dayItem.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      let completed = true;
      if (taskId === 'water') {
        completed = targetDayNum === currentDayNumber ? false : Number(data.amount) >= 2500;
      } else if (taskId === 'protein') {
        completed = targetDayNum === currentDayNumber ? false : Number(data.amount) >= 60;
      } else if (taskId === 'sleep' || taskId === 'yoga' || taskId === 'meditation') {
        completed = Number(data.amount) > 0;
      }

      const optimisticLog = {
        dayNumber: Number(targetDayNum),
        taskId,
        date: targetDate,
        completed,
        amount: Number(data.amount) || 0,
        unit: data.unit || TASK_CONFIG[taskId]?.unit || '',
        completedAt: new Date().toISOString(),
      };

      // 1. Save locally to Dexie IndexedDB
      const existing =
        (await db.taskLogs.where('[dayNumber+taskId]').equals([Number(targetDayNum), taskId]).first()) ||
        (await db.taskLogs.filter((l) => Number(l.dayNumber) === Number(targetDayNum) && l.taskId === taskId).first());

      if (existing) {
        await db.taskLogs.update(existing.id, optimisticLog);
      } else {
        await db.taskLogs.add(optimisticLog);
      }

      // Close modal popup
      setModalState((prev) => ({ ...prev, isOpen: false }));
      const taskName = TASK_CONFIG[taskId]?.name || taskId;
      showToast(`✓ ${taskName} updated to ${optimisticLog.amount} ${optimisticLog.unit}!`, 'success');

      // 2. Background Sync with Server API
      try {
        await api.post('/api/tasks/log', {
          dayNumber: Number(targetDayNum),
          taskId,
          amount: optimisticLog.amount,
          unit: optimisticLog.unit,
          completed,
          date: targetDate,
        });
      } catch (syncErr) {
        console.warn('API sync queued offline:', syncErr);
        await db.syncQueue.add({
          endpoint: '/api/tasks/log',
          method: 'POST',
          body: {
            dayNumber: Number(targetDayNum),
            taskId,
            amount: optimisticLog.amount,
            unit: optimisticLog.unit,
            completed,
            date: targetDate,
          },
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error saving task measure:', err);
      showToast('Failed to save measure. Please try again.', 'error');
    } finally {
      setSavingTask(false);
    }
  }

  // Loading state
  if (!user || !allLogs) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading Tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-28 md:pb-12 overflow-x-hidden">
      {/* Toast Alert / Lock notification */}
      {toast.message && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md text-xs font-bold rounded-2xl px-4 py-2.5 shadow-xl border animate-fade-in flex items-center gap-2 max-w-sm text-center ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-white border-emerald-700/60'
              : toast.type === 'lock'
              ? 'bg-gray-900/95 text-amber-300 border-amber-500/30'
              : 'bg-gray-900/95 text-white border-gray-700/60'
          }`}
        >
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'lock' && <span>🔒</span>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 sm:pt-6 space-y-4">
        {/* Tasks Card Header */}
        <section className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200/60">
                  Daily Tasks
                </span>
                <span className="text-xs font-mono font-bold text-gray-400">
                  Day {currentDayNumber} of 30
                </span>
              </div>
              <h1 className="font-display font-black text-xl sm:text-2xl text-gray-900 mt-1">
                30-Day Health Challenge
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Swipe left to view past cards. Tap any task directly on the card to log or update measures.
              </p>
            </div>

            {/* Quick jump to Today if viewing a past day */}
            {activeDay !== currentDayNumber && (
              <button
                type="button"
                onClick={() => setActiveDay(currentDayNumber)}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-2xl shadow-brand font-bold text-xs flex items-center gap-2 transition-all self-start sm:self-center"
              >
                <span>Jump to Today (Day {currentDayNumber})</span>
                <span className="text-sm">→</span>
              </button>
            )}
          </div>

          {/* Overall 30-Day Progress Bar */}
          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  <span>Total Challenge Completion</span>
                </span>
                <span className="font-mono text-brand-700 font-extrabold">
                  {overallStats.completedDays} / 30 Days ({overallStats.progressPct}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(overallStats.progressPct, 2)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* NOT STARTED WARNING IF APPLICABLE */}
        {!isChallengeStarted && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-amber-100 border border-amber-300 rounded-2xl mx-auto flex items-center justify-center text-amber-700 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-display font-black text-gray-900 text-base">Challenge has not started yet</h3>
            {user.startDate ? (
              <p className="text-xs text-gray-500 mt-1">
                Your 30-day challenge is scheduled to start on{' '}
                <span className="font-bold text-brand-600 font-mono">
                  {new Date(user.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>.
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Please start your challenge in Profile Settings.</p>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="mt-3 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Go to Settings
                </button>
              </div>
            )}
          </div>
        )}

        {/* DAY CONTROLS: PREVIOUS DAY BUTTON (LEFT) & CURRENT DAY LABEL (RIGHT) */}
        <div className="flex items-center justify-between px-2 pt-1">
          {/* Previous Day Button on Left Side */}
          <button
            type="button"
            onClick={handleGoToPreviousDay}
            disabled={activeDay <= 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl border text-xs font-bold transition-all shadow-xs ${
              activeDay <= 1
                ? 'border-gray-200 bg-gray-100/50 text-gray-300 cursor-not-allowed'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 hover:border-brand-400'
            }`}
            aria-label="Previous Day"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous Day</span>
          </button>

          {/* Current Day Label on Right Side */}
          <div className="flex items-center gap-2 text-right">
            {activeDay < currentDayNumber && (
              <button
                type="button"
                onClick={() => setActiveDay(currentDayNumber)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors shadow-2xs"
              >
                Today →
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-base sm:text-lg text-gray-900">
                Day {activeDay}
              </span>
              {activeDay === currentDayNumber && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white shadow-xs">
                  Today
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PEEKING CAROUSEL SECTION */}
        {/*
          Requirements satisfied:
          - "change the day block to carousal cards"
          - "no rightside swipe to next day cards"
          - "only left swipe to see previos day cards"
          - "the current day card is the dafault card on the screen"
          - "ad the edge of the previous day card on left side edge of the screen and behind the current day card"
        */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden py-3 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={isDragging ? handleTouchMove : undefined}
          onMouseUp={isDragging ? handleTouchEnd : undefined}
          onMouseLeave={isDragging ? handleTouchEnd : undefined}
        >
          {/* Carousel Track with smooth transform */}
          <div
            className={`flex items-stretch ${
              isDragging ? 'transition-none' : 'transition-transform duration-350 ease-out'
            }`}
            style={{
              transform: isDragging
                ? `translateX(calc(-${(activeDay - 1) * 100}% + ${dragOffset}px))`
                : `translateX(-${(activeDay - 1) * 100}%)`,
            }}
          >
            {/* Render unlocked days up to currentDayNumber */}
            {daysList.slice(0, currentDayNumber).map((day) => {
              const isCardActive = day.dNum === activeDay;

              return (
                <div
                  key={day.dNum}
                  className="w-full flex-shrink-0 flex justify-center px-1 sm:px-2"
                >
                  <DayCarouselCard
                    day={day}
                    logMap={day.logMap}
                    currentDayNumber={currentDayNumber}
                    isActive={isCardActive}
                    onSelectTask={handleSelectTask}
                    onCardClick={handleCardClick}
                    prevDaySleepLog={prevDaySleepLog}
                    isPrevDaySleepUnlocked={isPrevDaySleepUnlocked}
                    isPrevDaySleepCompleted={isPrevDaySleepCompleted}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* POPUP MODAL FOR MEASURES */}
      {/*
        Requirements satisfied:
        - "when selecting a task from card to update, a popup is created to add the measures."
        - "dont use any default values for new taks. start with zero."
        - "on the popup field to add the numbers and a button to update the value. that value is saved ."
      */}
      <TaskMeasureModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        dayNumber={modalState.dayNumber}
        dateFormatted={modalState.dateFormatted}
        taskId={modalState.taskId}
        existingLog={modalState.existingLog}
        onSave={handleSaveMeasure}
        loading={savingTask}
      />
    </div>
  );
}
