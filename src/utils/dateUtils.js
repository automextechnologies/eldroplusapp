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

export function parseLocalDate(input) {
  if (!input) return new Date();
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  return new Date(input);
}

export function formatDateStr(d) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateEndDate(startDateStrOrDate, durationMonths = 1) {
  if (!startDateStrOrDate) return null;
  const start = parseLocalDate(startDateStrOrDate);
  if (isNaN(start.getTime())) return null;

  const year = start.getFullYear();
  const month = start.getMonth(); // 0 - 11
  const day = start.getDate();

  const numMonths = Math.max(1, parseInt(durationMonths, 10) || 1);
  const targetTotalMonths = month + numMonths;
  const targetYear = year + Math.floor(targetTotalMonths / 12);
  const targetMonth = ((targetTotalMonths % 12) + 12) % 12;

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);

  return new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);
}

export function calculateTotalDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = parseLocalDate(startDate);
  const e = parseLocalDate(endDate);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

export function getCurrentDayNumber(startDate, totalDays) {
  if (!startDate) return 1;
  try {
    const start = parseLocalDate(startDate);
    if (isNaN(start.getTime())) return 1;
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 1;
    if (totalDays) {
      return Math.min(diff + 1, totalDays);
    }
    return diff + 1;
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
