export function isTaskCompleted(taskId, log, dayNumber, currentDayNumber) {
  if (!log) return false;

  if (taskId === 'yoga' || taskId === 'meditation' || taskId === 'sleep') {
    return log.completed === true || log.completed === 1 || (log.amount !== undefined && Number(log.amount) > 0);
  }

  if (taskId === 'water' || taskId === 'protein') {
    // Active day (today) hydration and protein tasks can never show as completed in the UI
    if (dayNumber === currentDayNumber) {
      return false;
    }
    return log.completed === true || log.completed === 1 || (log.amount !== undefined && Number(log.amount) > 0);
  }

  return log.completed === true || log.completed === 1 || (log.amount !== undefined && Number(log.amount) > 0);
}
