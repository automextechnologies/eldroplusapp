export function isTaskCompleted(taskId, log, dayNumber, currentDayNumber) {
  if (!log) return false;

  if (taskId === 'yoga' || taskId === 'meditation' || taskId === 'sleep') {
    return log.completed === true;
  }

  if (taskId === 'water') {
    // Water hydration goal is 2500ml (2.5L)
    // Active day (today) hydration tasks can never show as completed in the UI
    if (dayNumber === currentDayNumber) {
      return false;
    }
    return log.amount >= 2500;
  }

  if (taskId === 'protein') {
    // Protein daily goal is 60g
    // Active day (today) protein tasks can never show as completed in the UI
    if (dayNumber === currentDayNumber) {
      return false;
    }
    return log.amount >= 60;
  }

  return false;
}
