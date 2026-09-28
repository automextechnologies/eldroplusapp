import { useState, useEffect } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';

export default function TaskMeasureModal({
  isOpen,
  onClose,
  dayNumber,
  dateFormatted,
  taskId,
  existingLog,
  onSave,
  loading = false,
}) {
  const config = taskId ? TASK_CONFIG[taskId] : null;

  // Limits & quick add presets per task
  const limits = {
    water: { min: 0, max: 5000, step: 250, quickAdds: [250, 500, 750, 1000], targetText: 'Daily Goal: 2500 ml' },
    sleep: { min: 0, max: 24, step: 0.5, quickAdds: [6, 7, 8, 9], targetText: 'Optimal Target: 7 - 9 hrs' },
    protein: { min: 0, max: 200, step: 10, quickAdds: [15, 30, 45, 60], targetText: 'Daily Goal: 60 g' },
    yoga: { min: 0, max: 180, step: 15, quickAdds: [15, 30, 45, 60], targetText: 'Target: 15 - 60 min' },
    meditation: { min: 0, max: 120, step: 5, quickAdds: [5, 10, 15, 20], targetText: 'Target: 10 - 20 min' },
  }[taskId] || { min: 0, max: 1000, step: 1, quickAdds: [], targetText: '' };

  // STRICT REQUIREMENT: "dont use any default values for new taks. start with zero."
  // If an existing log with amount > 0 is passed, allow user to edit that amount.
  // Otherwise, start strictly at 0!
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (existingLog && existingLog.amount !== undefined && existingLog.amount !== null && Number(existingLog.amount) > 0) {
      setVal(existingLog.amount);
    } else {
      // Don't use any default values for new tasks. Start with zero!
      setVal(0);
    }
  }, [isOpen, existingLog, taskId]);

  if (!isOpen || !config) return null;

  function handleInputChange(e) {
    const raw = e.target.value;
    // Allow empty string while typing, otherwise only valid numbers (and decimal point for sleep)
    const regex = taskId === 'sleep' ? /^\d*\.?\d*$/ : /^\d*$/;
    if (!regex.test(raw)) return;
    if (raw === '') {
      setVal('');
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num) && num <= limits.max) {
      setVal(raw);
    }
  }

  function handleStep(direction) {
    const current = Number(val) || 0;
    const next = direction > 0 ? current + limits.step : current - limits.step;
    const clamped = Math.max(0, Math.min(next, limits.max));
    const finalVal = taskId === 'sleep' ? Number(clamped.toFixed(1)) : Math.round(clamped);
    setVal(finalVal);
  }

  function handleQuickAdd(amount) {
    if (taskId === 'sleep') {
      setVal(amount);
    } else {
      const current = Number(val) || 0;
      setVal(Math.min(current + amount, limits.max));
    }
  }

  function handleSaveClick() {
    const numericAmount = Number(val) || 0;
    onSave(dayNumber, taskId, {
      amount: numericAmount,
      unit: config.unit,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl border border-gray-200/90 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 shadow-inner"
              style={{
                backgroundColor: config.color + '15',
                color: config.color,
              }}
            >
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base text-gray-900 leading-tight">
                  {config.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
                  Day {dayNumber}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {dateFormatted || `Day ${dayNumber} Log`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 text-sm font-bold transition-colors disabled:opacity-40"
            aria-label="Close popup"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Target Guidance Pill */}
          {limits.targetText && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                <span>{limits.targetText}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                {config.unit}
              </span>
            </div>
          )}

          {/* Stepper with Large Input Field */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
              Add Measure ({config.unit})
            </label>
            <div className="flex items-center justify-center gap-3">
              {/* Minus / Reduce button */}
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={loading || Number(val || 0) <= 0}
                className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 font-black text-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs border border-gray-200/80"
                aria-label="Decrease measure"
              >
                −
              </button>

              {/* Number Input: Only numbers allowed */}
              <div className="relative flex-1 max-w-[170px]">
                <input
                  type="text"
                  inputMode={taskId === 'sleep' ? 'decimal' : 'numeric'}
                  pattern={taskId === 'sleep' ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
                  value={val === '' ? '' : val}
                  onChange={handleInputChange}
                  placeholder="0"
                  autoFocus
                  className="w-full h-13 text-center font-mono font-black text-2xl sm:text-3xl text-gray-900 bg-white border-2 border-gray-200 focus:border-brand-500 rounded-2xl focus:outline-none shadow-inner transition-all px-2"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none font-mono">
                  {config.unit}
                </span>
              </div>

              {/* Plus / Increase button */}
              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={loading || Number(val || 0) >= limits.max}
                className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 font-black text-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs border border-gray-200/80"
                aria-label="Increase measure"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick-Add Chips */}
          {limits.quickAdds.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                {taskId === 'sleep' ? 'Quick Hours' : 'Quick Add'}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {limits.quickAdds.map((addVal) => (
                  <button
                    key={addVal}
                    type="button"
                    onClick={() => handleQuickAdd(addVal)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-brand-500/40 text-xs font-bold transition-all bg-white active:scale-95 text-gray-700 hover:text-gray-900 shadow-2xs hover:bg-brand-50/40"
                  >
                    {taskId === 'sleep' ? `${addVal} hrs` : `+${addVal} ${config.unit}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs active:scale-95 transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={loading}
              className="flex-[2] py-3 px-4 rounded-2xl text-white font-bold text-xs active:scale-95 transition-all shadow-brand flex items-center justify-center gap-2 disabled:opacity-50 bg-brand-500 hover:bg-brand-600"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Value</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
