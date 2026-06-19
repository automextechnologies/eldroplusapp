import { useState } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';

const ADDS = [250, 500, 750, 1000];

export default function WaterTask({ onSubmit, existingLog, loading }) {
  const currentTotal = existingLog?.amount || 0;
  const [sessionAdd, setSessionAdd] = useState(0);
  const [custom, setCustom] = useState('');

  const newTotal = currentTotal + sessionAdd;
  const displayTotal = currentTotal >= 1000 ? `${(currentTotal/1000).toFixed(1)}L` : `${currentTotal}ml`;
  const displayNewTotal = newTotal >= 1000 ? `${(newTotal/1000).toFixed(1)}L` : `${newTotal}ml`;
  const goalPercent = Math.min((newTotal / 2500) * 100, 100);

  function handleQuickAdd(ml) {
    setSessionAdd((p) => p + ml);
  }

  function handleCustomAdd() {
    const val = parseInt(custom, 10);
    if (val > 0) {
      setSessionAdd((p) => p + val);
      setCustom('');
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="bg-blue-50/70 rounded-3xl p-6 text-center border border-blue-100">
        <div className="w-12 h-12 mx-auto mb-3 text-sky-600 flex items-center justify-center">
          {TASK_CONFIG.water.icon}
        </div>
        <div className="flex justify-center items-baseline gap-1.5 flex-wrap">
          <p className="font-mono font-bold text-5xl text-blue-700">{displayNewTotal}</p>
          {sessionAdd > 0 && (
            <span className="text-sm font-bold text-blue-500 font-mono">({displayTotal} + {sessionAdd}ml)</span>
          )}
        </div>
        <p className="text-xs text-muted font-medium mt-1">of 2.5L daily goal</p>
        <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${goalPercent}%` }} />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Tap to add water</p>
        <div className="grid grid-cols-4 gap-2">
          {ADDS.map((ml) => (
            <button key={ml} onClick={() => handleQuickAdd(ml)}
              className="py-2.5 rounded-xl border border-blue-100 bg-blue-50/50 text-blue-700 font-bold text-xs active:scale-95 transition-all hover:bg-blue-50">
              +{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input type="number" placeholder="Custom amount (ml)" value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCustomAdd(); }}
          className="input-field flex-1" />
        <button onClick={handleCustomAdd}
          className="px-4 py-3 rounded-2xl bg-blue-500 text-white font-bold text-sm">Add</button>
      </div>

      {sessionAdd > 0 && (
        <button onClick={() => setSessionAdd(0)} className="w-full text-xs text-muted underline text-center">Clear additions</button>
      )}

      {currentTotal > 0 && sessionAdd === 0 && (
        <button onClick={() => onSubmit({ amount: 0, unit: 'ml' })} className="w-full text-xs text-red-500 underline text-center">Reset today's water to 0</button>
      )}

      <button onClick={() => onSubmit({ amount: newTotal, unit: 'ml' })} disabled={loading || (sessionAdd === 0 && currentTotal === newTotal)}
        className="btn-brand disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0EA5E9, #0369A1)' }}>
        {loading ? 'Saving...' : 'Add to hydration'}
      </button>
    </div>
  );
}
