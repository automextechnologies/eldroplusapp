import { isDayUnlocked, getUnlockDate } from '../utils/dateUtils';

export function useDayUnlock(startDate) {
  return {
    isUnlocked: (dayNumber) => isDayUnlocked(dayNumber, startDate),
    getUnlockDate: (dayNumber) => getUnlockDate(dayNumber, startDate),
  };
}
