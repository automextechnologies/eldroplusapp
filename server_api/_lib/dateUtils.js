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

/**
 * Calculates end date based on startDate and durationMonths:
 * "if selected one month day x then the program ends at next month day x. like wise add the logic."
 * Handles month-end capping for shorter months (e.g., Jan 31 + 1 month -> Feb 28).
 */
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

  // Maximum number of days in the target month (day 0 of next month)
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);

  return new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);
}

/**
 * Total days inclusive of both start and end dates.
 */
export function calculateTotalDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = parseLocalDate(startDate);
  const e = parseLocalDate(endDate);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

/**
 * Resolves full timeline for a batch or user start date.
 */
export function getBatchTimeline(batch) {
  if (!batch || !batch.startDate) {
    return {
      startDate: null,
      endDate: null,
      totalDays: 30,
      durationMonths: 1,
    };
  }

  const start = parseLocalDate(batch.startDate);
  start.setHours(0, 0, 0, 0);

  const durationMonths = batch.durationMonths || 1;
  let end;
  if (batch.endDate) {
    end = parseLocalDate(batch.endDate);
  } else {
    end = calculateEndDate(start, durationMonths);
  }
  end.setHours(23, 59, 59, 999);

  const totalDays = batch.totalDays || calculateTotalDays(start, end);

  return {
    startDate: start,
    endDate: end,
    durationMonths,
    totalDays,
  };
}
