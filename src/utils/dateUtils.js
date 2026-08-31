import { addDays, parseISO, setHours, setMinutes, format } from 'date-fns';

export function formatDate(d = new Date()) {
  try {
    return format(d, 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

export function isDayUnlocked(dayNumber, startDate) {
  if (!startDate) return false;
  try {
    const dateStr = typeof startDate === 'string' ? startDate : (startDate?.toISOString ? startDate.toISOString().split('T')[0] : String(startDate));
    if (!dateStr) return false;
    const start = parseISO(dateStr);
    if (isNaN(start.getTime())) return false;
    let unlockDate = addDays(start, (dayNumber || 1) - 1);
    unlockDate = setHours(setMinutes(unlockDate, 0), 0);
    return unlockDate <= new Date();
  } catch {
    return false;
  }
}

export function getUnlockDate(dayNumber, startDate) {
  if (!startDate) return new Date();
  try {
    const dateStr = typeof startDate === 'string' ? startDate : (startDate?.toISOString ? startDate.toISOString().split('T')[0] : String(startDate));
    if (!dateStr) return new Date();
    const start = parseISO(dateStr);
    if (isNaN(start.getTime())) return new Date();
    let unlockDate = addDays(start, (dayNumber || 1) - 1);
    unlockDate = setHours(setMinutes(unlockDate, 0), 0);
    return unlockDate;
  } catch {
    return new Date();
  }
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
    return format(date, 'MMM d') + ' at 12:00 AM';
  } catch {
    return '12:00 AM';
  }
}
