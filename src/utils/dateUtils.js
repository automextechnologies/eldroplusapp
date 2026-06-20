import { addDays, parseISO, setHours, setMinutes, isBefore, format } from 'date-fns';

export function formatDate(d = new Date()) {
  return format(d, 'yyyy-MM-dd');
}

export function isDayUnlocked(dayNumber, startDate) {
  if (!startDate) return false;
  const start = parseISO(typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0]);
  let unlockDate = addDays(start, dayNumber - 1);
  unlockDate = setHours(setMinutes(unlockDate, 0), 1);
  return isBefore(unlockDate, new Date());
}

export function getUnlockDate(dayNumber, startDate) {
  const start = parseISO(typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0]);
  let unlockDate = addDays(start, dayNumber - 1);
  unlockDate = setHours(setMinutes(unlockDate, 0), 1);
  return unlockDate;
}

export function getCurrentDayNumber(startDate) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 30);
}

export function formatUnlockDate(date) {
  return format(date, 'MMM d') + ' at 1:00 AM';
}
