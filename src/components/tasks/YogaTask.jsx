import { useState } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';

const CHIPS = [15, 30, 45, 60];

export default function YogaTask({ onSubmit, existingLog, loading }) {
  const [minutes, setMinutes] = useState(existingLog?.amount || 30);

  return (
    <div className="space-y-6 pt-2">
      <div className="bg-green-50 rounded-3xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 text-green-600 flex items-center justify-center">
          {TASK_CONFIG.yoga.icon}
        </div>
        <p className="font-mono font-bold text-5xl text-gray-900">{minutes}</p>
        <p className="text-sm text-muted font-medium mt-1">minutes</p>
      </div>

      <div className="space-y-2">
        <input type="range" min={5} max={120} step={5} value={minutes}
          onChange={(e) => setMinutes(+e.target.value)} className="w-full" style={{ accentColor:'#12B76A' }} />
        <div className="flex justify-between text-xs text-muted font-medium">
          <span>5 min</span><span>120 min</span>
        </div>
      </div>

      <div className="flex gap-2">
        {CHIPS.map((m) => (
          <button key={m} onClick={() => setMinutes(m)}
            className={`task-chip ${minutes === m ? 'active' : ''}`}>
            {m}m
          </button>
        ))}
      </div>

      <button onClick={() => onSubmit({ amount: minutes, unit: 'min' })} disabled={loading}
        className="btn-brand" style={{ background: 'linear-gradient(135deg, #12B76A, #027A48)' }}>
        {loading ? 'Saving...' : existingLog?.completed ? '✓ Update Yoga' : 'Complete Yoga ✓'}
      </button>
    </div>
  );
}
