import { useState, useEffect } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';
import { isTaskCompleted } from '../../utils/taskCompletion';

export default function TaskCard({ 
  taskId, 
  log, 
  dayNumber, 
  currentDayNumber, 
  readonly = false, 
  lockReason = '',
  customTitle = '',
  customSubtitle = '',
  expanded = false, 
  onToggleExpand, 
  onSubmit, 
  loading = false 
}) {
  const config = TASK_CONFIG[taskId];
  const isCompleted = isTaskCompleted(taskId, log, dayNumber, currentDayNumber);

  // Local state for inline editing (can be string while typing or number)
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
    const amt = amountValue !== undefined ? (Number(amountValue) || 0) : (log?.amount || 0);
    if (taskId === 'water') return amt >= 1000 ? `${(amt / 1000).toFixed(1)}L` : `${amt}ml`;
    if (taskId === 'yoga' || taskId === 'meditation') return `${amt} min`;
    if (taskId === 'protein') return `${amt}g`;
    if (taskId === 'sleep') return `${amt} hrs`;
    return `${amt} ${config?.unit || ''}`;
  }

  function getSubtext() {
    if (customSubtitle) return customSubtitle;
    if (isCompleted && readonly) return `${formatAmount()} · Completed (Locked)`;
    if (isCompleted) return `${formatAmount()} · Completed`;
    if (readonly) return lockReason || 'Locked';
    if (log && log.amount > 0) {
      return `${formatAmount()} logged`;
    }
    if (taskId === 'sleep') return "Log sleep";
    return 'Tap to log';
  }

  // Configuration for limits & steps
  const taskLimits = {
    water: { min: 0, max: 5000, step: 250, quickAdds: [250, 500, 750, 1000] },
    sleep: { min: 0, max: 24, step: 0.5, quickAdds: [6, 7, 8, 9] },
    protein: { min: 0, max: 200, step: 10, quickAdds: [10, 20, 30, 50] },
    yoga: { min: 0, max: 180, step: 15, quickAdds: [15, 30, 45, 60] },
    meditation: { min: 0, max: 120, step: 5, quickAdds: [5, 10, 15, 20] },
  }[taskId] || { min: 0, max: 1000, step: 1, quickAdds: [] };

  function handleInputChange(e) {
    const raw = e.target.value;
    // The field only allows numbers (and at most one decimal point for sleep)
    const regex = taskId === 'sleep' ? /^\d*\.?\d*$/ : /^\d*$/;
    if (!regex.test(raw)) return;
    if (raw === '') {
      setVal('');
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num) && num <= taskLimits.max) {
      setVal(raw);
    }
  }

  function handleStep(direction) {
    const current = Number(val) || 0;
    const next = direction > 0 ? current + taskLimits.step : current - taskLimits.step;
    const clamped = Math.max(0, Math.min(next, taskLimits.max));
    const finalVal = taskId === 'sleep' ? Number(clamped.toFixed(1)) : Math.round(clamped);
    setVal(finalVal);
  }

  function handleQuickAdd(amount) {
    if (taskId === 'sleep') {
      setVal(amount);
    } else {
      const current = Number(val) || 0;
      setVal(Math.min(current + amount, taskLimits.max));
    }
  }

  return (
    <div
      className={`w-full rounded-[20px] border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'bg-white border-[#00A86B]/30 shadow-sm'
          : readonly
          ? 'bg-black/[0.02] border-black/[0.04] opacity-60'
          : expanded
          ? 'bg-white border-[#00A86B]/30 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
          : 'bg-white border-black/[0.06] shadow-sm hover:border-black/[0.1] hover:shadow-md'
      }`}
    >
      {/* Clickable Header Part */}
      <div
        role="button"
        tabIndex={readonly ? -1 : 0}
        onClick={() => !readonly && onToggleExpand && onToggleExpand()}
        className={`w-full text-left flex items-center gap-3.5 px-4 py-3.5 select-none ${
          readonly ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/[0.02] active:bg-black/[0.04]'
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
          <p className={`font-display font-bold text-[15px] ${readonly && !isCompleted ? 'text-gray-400' : 'text-gray-800'}`}>
            {customTitle || config?.name || taskId}
          </p>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {getSubtext()}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="flex items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(132,180,156,0.2)]"
                style={{ backgroundColor: config?.color || '#10b981' }}
              >
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {readonly && (
                <svg className="w-3.5 h-3.5 text-gray-400 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
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
          {/* Dynamic label */}
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Log Amount</span>
            <span className="text-lg font-mono font-extrabold" style={{ color: config.color }}>
              {formatAmount(val)}
            </span>
          </div>

          {/* Stepper with Number Input and "-" / "+" buttons */}
          <div className="flex items-center justify-center gap-3">
            {/* Reduce button */}
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={Number(val || 0) <= 0}
              className="w-11 h-11 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] font-bold text-xl flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Reduce amount"
            >
              −
            </button>

            {/* Numeric input field - only numbers allowed */}
            <div className="relative flex-1 max-w-[170px]">
              <input
                type="text"
                inputMode="decimal"
                value={val === '' ? '' : val}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full h-11 text-center font-mono font-bold text-xl text-[#1D1D1F] bg-black/[0.03] border border-black/[0.08] focus:border-[#00A86B] focus:bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#00A86B]/15 transition-all px-3"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#86868B] pointer-events-none">
                {config?.unit || ''}
              </span>
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={Number(val || 0) >= taskLimits.max}
              className="w-11 h-11 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] font-bold text-xl flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Add amount"
            >
              +
            </button>
          </div>

          {/* Quick-Log Badges */}
          {taskLimits.quickAdds.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                {taskId === 'sleep' ? 'Quick Select' : 'Quick Add'}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {taskLimits.quickAdds.map((addVal) => (
                  <button
                    key={addVal}
                    type="button"
                    onClick={() => handleQuickAdd(addVal)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand-500/40 text-xs font-bold transition-all bg-white active:scale-95 text-gray-600 hover:text-gray-900 shadow-2xs"
                  >
                    {taskId === 'sleep' ? `${addVal}h` : `+${addVal}${config.unit}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSubmit(taskId, { amount: Number(val) || 0, unit: config.unit })}
              disabled={loading || (Number(log?.amount || 0) === Number(val || 0))}
              className="flex-1 py-2.5 rounded-full text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
              style={{
                backgroundColor: config.color || '#00A86B'
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
              className="px-4 py-2.5 rounded-full border border-black/[0.08] text-[#86868B] text-xs font-medium bg-black/[0.03] active:scale-95 transition-all hover:text-[#1D1D1F] hover:bg-black/[0.06]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
