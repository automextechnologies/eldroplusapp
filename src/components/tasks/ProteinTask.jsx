import { useState } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';

const CHIPS = [10, 20, 30, 50];

export default function ProteinTask({ onSubmit, existingLog, loading }) {
  const currentTotal = existingLog?.amount || 0;
  const [sessionAdd, setSessionAdd] = useState(0);
  const [custom, setCustom] = useState('');

  const newTotal = currentTotal + sessionAdd;
  const goalPercent = Math.min((newTotal / 60) * 100, 100);

  function handleQuickAdd(g) {
    setSessionAdd((p) => p + g);
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
      <div className="bg-orange-50/70 rounded-3xl p-6 text-center border border-orange-100">
        <div className="w-12 h-12 mx-auto mb-3 text-orange-600 flex items-center justify-center">
          {TASK_CONFIG.protein.icon}
        </div>
        <div className="flex justify-center items-baseline gap-1.5 flex-wrap">
          <p className="font-mono font-bold text-5xl text-orange-700">{newTotal}g</p>
          {sessionAdd > 0 && (
            <span className="text-sm font-bold text-orange-500 font-mono">({currentTotal}g + {sessionAdd}g)</span>
          )}
        </div>
        <p className="text-xs text-muted font-medium mt-1">of 60g daily goal</p>
        <div className="mt-3 h-2 bg-orange-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${goalPercent}%` }} />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Tap to add protein</p>
        <div className="grid grid-cols-4 gap-2">
          {CHIPS.map((g) => (
            <button key={g} onClick={() => handleQuickAdd(g)}
              className="py-2.5 rounded-xl border border-orange-100 bg-orange-50/50 text-orange-700 font-bold text-xs active:scale-95 transition-all hover:bg-orange-50">
              +{g}g
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input type="number" placeholder="Custom amount (g)" value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCustomAdd(); }}
          className="input-field flex-1" />
        <button onClick={handleCustomAdd}
          className="px-4 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm">Add</button>
      </div>

      {sessionAdd > 0 && (
        <button onClick={() => setSessionAdd(0)} className="w-full text-xs text-muted underline text-center">Clear additions</button>
      )}

      {currentTotal > 0 && sessionAdd === 0 && (
        <button onClick={() => onSubmit({ amount: 0, unit: 'g' })} className="w-full text-xs text-red-500 underline text-center">Reset today's protein to 0</button>
      )}

      <button onClick={() => onSubmit({ amount: newTotal, unit: 'g' })} disabled={loading || (sessionAdd === 0 && currentTotal === newTotal)}
        className="btn-brand disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #F97316, #C2410C)' }}>
        {loading ? 'Saving...' : 'Add to protein'}
      </button>
    </div>
  );
}
