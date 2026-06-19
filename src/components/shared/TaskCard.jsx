import { TASK_CONFIG } from '../../utils/taskConfig';
import { isTaskCompleted } from '../../utils/taskCompletion';

export default function TaskCard({ taskId, log, onTap, dayNumber, currentDayNumber, readonly = false }) {
  const config = TASK_CONFIG[taskId];
  const isCompleted = isTaskCompleted(taskId, log, dayNumber, currentDayNumber);

  function formatAmount() {
    if (!log) return null;
    if (taskId === 'water') return `${log.amount >= 1000 ? (log.amount / 1000).toFixed(1) + 'L' : log.amount + 'ml'}`;
    if (taskId === 'yoga' || taskId === 'meditation') return `${log.amount} min`;
    if (taskId === 'protein') return `${log.amount}g`;
    if (taskId === 'sleep') return `${log.amount} hrs`;
    return `${log.amount} ${log.unit}`;
  }

  const amount = formatAmount();

  const isToday = dayNumber === currentDayNumber;

  function getSubtext() {
    if (isCompleted) return `${amount} · Completed`;
    
    // Not completed, but has logged amount
    if (log && log.amount > 0) {
      if (taskId === 'water') return `${amount} logged · Goal: 2.5L`;
      if (taskId === 'protein') return `${amount} logged · Goal: 60g`;
      return `${amount} logged`;
    }

    if (taskId === 'sleep') return "Log last night's sleep";
    return 'Tap to log';
  }

  return (
    <button
      onClick={() => !readonly && onTap && onTap(taskId, dayNumber)}
      className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-white border-[#EAECF0] shadow-sm'
          : readonly
          ? 'bg-gray-50/50 border-[#EAECF0] opacity-75 cursor-not-allowed'
          : 'bg-white border-[#EAECF0] shadow-sm hover:border-gray-300 hover:shadow-md active:scale-[0.99]'
      }`}
      style={isCompleted ? { backgroundColor: '#FAFAFA' } : {}}
      disabled={readonly}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ 
          backgroundColor: isCompleted ? config.color + '20' : readonly ? '#f8fafc' : config.lightBg, 
          color: readonly && !isCompleted ? '#94a3b8' : config.color 
        }}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-display font-bold text-[15px] ${readonly && !isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>{config.name}</p>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          {getSubtext()}
        </p>
      </div>
      <div className="flex-shrink-0">
        {isCompleted ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: config.color }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : readonly ? (
          <svg className="w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );
}
