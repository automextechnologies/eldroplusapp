import { useState } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';

const CHIPS = [6, 7, 7.5, 8];

export default function SleepTask({ onSubmit, existingLog, loading, dayNumber }) {
  const [hours, setHours] = useState(existingLog?.amount || 7);

  const quality = hours >= 8 ? { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    : hours >= 7 ? { label: 'Good', color: 'text-brand-600', bg: 'bg-brand-50' }
    : hours >= 6 ? { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    : { label: 'Poor', color: 'text-red-500', bg: 'bg-red-50' };

  return (
    <div className="space-y-6 pt-2">
      <div className="bg-indigo-50 rounded-3xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 text-indigo-600 flex items-center justify-center">
          {TASK_CONFIG.sleep.icon}
        </div>
        <p className="font-mono font-bold text-5xl text-indigo-700">{hours}</p>
        <p className="text-sm text-muted font-medium mt-1">hours of sleep</p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${quality.bg} ${quality.color}`}>
          {quality.label}
        </span>
      </div>

      <div className="space-y-2">
        <input type="range" min={0} max={12} step={0.5} value={hours}
          onChange={(e) => setHours(+e.target.value)} className="w-full" style={{ accentColor:'#6366F1' }} />
        <div className="flex justify-between text-xs text-muted font-medium">
          <span>0h</span><span>12h</span>
        </div>
      </div>

      <div className="flex gap-2">
        {CHIPS.map((h) => (
          <button key={h} onClick={() => setHours(h)}
            className={`task-chip ${hours === h ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : ''}`}>
            {h}h
          </button>
        ))}
      </div>

      <button onClick={() => onSubmit({ amount: hours, unit: 'hrs', forDay: dayNumber })} disabled={loading}
        className="btn-brand" style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
        {loading ? 'Saving...' : existingLog?.completed ? '✓ Update Sleep' : 'Save Sleep ✓'}
      </button>
    </div>
  );
}
