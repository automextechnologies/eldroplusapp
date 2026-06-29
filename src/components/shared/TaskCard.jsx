import { useState, useEffect } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';
import { isTaskCompleted } from '../../utils/taskCompletion';

export default function TaskCard({ 
  taskId, 
  log, 
  dayNumber, 
  currentDayNumber, 
  readonly = false, 
  expanded = false, 
  onToggleExpand, 
  onSubmit, 
  loading = false 
}) {
  const config = TASK_CONFIG[taskId];
  const isCompleted = isTaskCompleted(taskId, log, dayNumber, currentDayNumber);

  // Local state for inline editing
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (log) {
      setVal(log.amount || 0);
    } else {
      // Default placeholder values for empty logging
      if (taskId === 'sleep') setVal(8);
      else if (taskId === 'water') setVal(1000);
      else if (taskId === 'protein') setVal(30);
      else if (taskId === 'yoga') setVal(30);
      else if (taskId === 'meditation') setVal(15);
      else setVal(0);
    }
  }, [log, expanded]);

  function formatAmount(amountValue) {
    const amt = amountValue !== undefined ? amountValue : (log?.amount || 0);
    if (taskId === 'water') return amt >= 1000 ? `${(amt / 1000).toFixed(1)}L` : `${amt}ml`;
    if (taskId === 'yoga' || taskId === 'meditation') return `${amt} min`;
    if (taskId === 'protein') return `${amt}g`;
    if (taskId === 'sleep') return `${amt} hrs`;
    return `${amt} ${config.unit}`;
  }

  function getSubtext() {
    if (isCompleted) return `${formatAmount()} · Completed`;
    if (log && log.amount > 0) {
      return `${formatAmount()} logged`;
    }
    if (taskId === 'sleep') return "Log last night's sleep";
    return 'Tap to log';
  }

  // Configuration for sliders
  const sliderConfig = {
    water: { min: 0, max: 4000, step: 100, quickAdds: [250, 500, 750, 1000] },
    sleep: { min: 4, max: 14, step: 0.5, quickAdds: [6, 7, 8, 9, 10] },
    protein: { min: 0, max: 150, step: 5, quickAdds: [10, 20, 30, 55] },
    yoga: { min: 0, max: 120, step: 5, quickAdds: [15, 30, 45, 60] },
    meditation: { min: 0, max: 60, step: 5, quickAdds: [5, 10, 15, 20] },
  }[taskId] || { min: 0, max: 100, step: 1, quickAdds: [] };

  function handleQuickAdd(amount) {
    if (taskId === 'sleep') {
      setVal(amount); // For sleep, quick buttons act as direct values
    } else {
      setVal(prev => Math.min(prev + amount, sliderConfig.max));
    }
  }

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-300 overflow-hidden ${
        isCompleted
          ? 'bg-white border-brand-500/25 shadow-[0_4px_16px_rgba(232,76,30,0.04)]'
          : readonly
          ? 'bg-gray-50/50 border-gray-100 opacity-60'
          : expanded
          ? 'bg-white border-brand-500/30 shadow-[0_12px_30px_rgba(0,0,0,0.06)] scale-[1.01]'
          : 'bg-white border-gray-200/80 shadow-sm hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Clickable Header Part */}
      <div
        role="button"
        tabIndex={readonly ? -1 : 0}
        onClick={() => !readonly && onToggleExpand && onToggleExpand()}
        className={`w-full text-left flex items-center gap-4 px-4 py-3.5 select-none ${
          readonly ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100/50'
        }`}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl transition-all"
          style={{ 
            backgroundColor: isCompleted ? config.color + '15' : readonly ? 'rgba(0,0,0,0.01)' : config.color + '10', 
            color: readonly && !isCompleted ? '#9ca3af' : config.color 
          }}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-display font-bold text-[15px] ${readonly && !isCompleted ? 'text-gray-400' : 'text-gray-800'}`}>{config.name}</p>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {getSubtext()}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(232,76,30,0.15)]" style={{ backgroundColor: config.color }}>
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : readonly ? (
            <svg className="w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ) : (
            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-90 text-brand-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Inline Expanded Logger Panel */}
      {expanded && !readonly && (
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-fade-in">
          {/* Dynamic slider label */}
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Log Amount</span>
            <span className="text-lg font-mono font-extrabold" style={{ color: config.color }}>
              {formatAmount(val)}
            </span>
          </div>

          {/* Range Slider */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={sliderConfig.min}
              max={sliderConfig.max}
              step={sliderConfig.step}
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200"
              style={{
                background: `linear-gradient(to right, ${config.color} 0%, ${config.color} ${((val - sliderConfig.min) / (sliderConfig.max - sliderConfig.min)) * 100}%, rgba(0,0,0,0.06) ${((val - sliderConfig.min) / (sliderConfig.max - sliderConfig.min)) * 100}%, rgba(0,0,0,0.06) 100%)`
              }}
            />
          </div>

          {/* Quick-Log Badges */}
          {sliderConfig.quickAdds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {taskId === 'sleep' ? 'Quick Select' : 'Quick Add'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {sliderConfig.quickAdds.map((addVal) => (
                  <button
                    key={addVal}
                    type="button"
                    onClick={() => handleQuickAdd(addVal)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand-500/40 text-xs font-bold transition-all bg-white active:scale-95 text-gray-600 hover:text-gray-900"
                  >
                    {taskId === 'sleep' ? `${addVal}h` : `+${addVal}${config.unit}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-2">
            {log?.amount > 0 && (
              <button
                type="button"
                onClick={() => onSubmit(taskId, { amount: 0, unit: config.unit })}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold bg-red-50 active:scale-95 transition-all hover:bg-red-100/50"
              >
                Reset to 0
              </button>
            )}
            <button
              type="button"
              onClick={() => onSubmit(taskId, { amount: val, unit: config.unit })}
              disabled={loading || (log?.amount === val)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(232,76,30,0.15)]"
              style={{
                background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}bb 100%)`
              }}
            >
              {loading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : null}
              {log?.amount > 0 ? 'Update Log' : 'Save Log'}
            </button>
            <button
              type="button"
              onClick={onToggleExpand}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-bold bg-white active:scale-95 transition-all hover:text-gray-950 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
