import { addDays, parseISO, setHours, setMinutes, format } from 'date-fns';

export function formatDate(d = new Date()) {
  try {
    return format(d, 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

export function getDayTimings(dayNumber, startDate) {
  if (!startDate) return null;
  try {
    let start;
    if (startDate instanceof Date) {
      start = new Date(startDate.getTime());
    } else if (typeof startDate === 'string') {
      if (startDate.includes('T')) {
        start = new Date(startDate);
      } else {
        start = parseISO(startDate);
      }
    } else {
      start = new Date(startDate);
    }
    if (isNaN(start.getTime())) return null;
    start.setHours(0, 0, 0, 0);

    const dNum = Math.max(1, parseInt(dayNumber, 10) || 1);
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + (dNum - 1));
    dayDate.setHours(0, 0, 0, 0);

    // Day 1 unlocks on start date; Day 2+ unlocks at 3:00 AM on that day's date
    const dayUnlockTime = dNum === 1
      ? new Date(start)
      : new Date(dayDate);
    if (dNum > 1) {
      dayUnlockTime.setHours(3, 0, 0, 0);
    }

    // Normal tasks lock at 1:00 AM on the day after this day
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const normalTasksLockTime = new Date(nextDay);
    normalTasksLockTime.setHours(1, 0, 0, 0);

    // Sleep task for this day unlocks at 3:00 AM on the day after this day
    const sleepUnlockTime = new Date(nextDay);
    sleepUnlockTime.setHours(3, 0, 0, 0);

    return {
      dayDate,
      dayUnlockTime,
      normalTasksLockTime,
      sleepUnlockTime,
    };
  } catch {
    return null;
  }
}

export function isDayBlockUnlocked(dayNumber, startDate, now = new Date()) {
  const timings = getDayTimings(dayNumber, startDate);
  if (!timings) return false;
  return now >= timings.dayUnlockTime;
}

export function isNormalTasksUnlocked(dayNumber, startDate, now = new Date()) {
  const timings = getDayTimings(dayNumber, startDate);
  if (!timings) return false;
  return now >= timings.dayUnlockTime && now < timings.normalTasksLockTime;
}

export function isSleepTaskUnlocked(dayNumber, startDate, now = new Date()) {
  const timings = getDayTimings(dayNumber, startDate);
  if (!timings) return false;
  return now >= timings.sleepUnlockTime;
}

export function isSleepTaskCompleted(log) {
  if (!log) return false;
  return log.completed === true || log.completed === 1 || (log.amount !== undefined && Number(log.amount) > 0);
}

export function isSleepTaskLocked(dayNumber, startDate, log, now = new Date()) {
  // 1. If sleep has been completed, it is immediately locked
  if (isSleepTaskCompleted(log)) return true;
  // 2. If it hasn't reached 3:00 AM unlock time, it is locked
  return !isSleepTaskUnlocked(dayNumber, startDate, now);
}

export function isDayUnlocked(dayNumber, startDate) {
  return isDayBlockUnlocked(dayNumber, startDate);
}

export function getUnlockDate(dayNumber, startDate) {
  const timings = getDayTimings(dayNumber, startDate);
  return timings ? timings.dayUnlockTime : new Date();
}

export function getCurrentDayNumber(startDate) {
  if (!startDate) return 1;
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 1;
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), 30);
  } catch {
    return 1;
  }
}

export function formatUnlockDate(date) {
  try {
    return format(date, 'MMM d') + ' at 3:00 AM';
  } catch {
    return '3:00 AM';
  }
}
