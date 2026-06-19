import { useState } from 'react';
import { TASK_CONFIG } from '../../utils/taskConfig';

const CHIPS = [5, 10, 15, 20];

export default function MeditationTask({ onSubmit, existingLog, loading }) {
  const [minutes, setMinutes] = useState(existingLog?.amount || 10);

  return (
    <div className="space-y-6 pt-2">
      <div className="bg-purple-50 rounded-3xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 text-purple-600 flex items-center justify-center">
          {TASK_CONFIG.meditation.icon}
        </div>
        <p className="font-mono font-bold text-5xl text-gray-900">{minutes}</p>
        <p className="text-sm text-muted font-medium mt-1">minutes</p>
      </div>

      <div className="space-y-2">
        <input type="range" min={5} max={60} step={5} value={minutes}
          onChange={(e) => setMinutes(+e.target.value)} className="w-full" style={{ accentColor:'#7C3AED' }} />
        <div className="flex justify-between text-xs text-muted font-medium">
          <span>5 min</span><span>60 min</span>
        </div>
      </div>

      <div className="flex gap-2">
        {CHIPS.map((m) => (
          <button key={m} onClick={() => setMinutes(m)}
            className={`task-chip ${minutes === m ? 'border-purple-400 bg-purple-50 text-purple-700' : ''}`}>
            {m}m
          </button>
        ))}
      </div>

      <button onClick={() => onSubmit({ amount: minutes, unit: 'min' })} disabled={loading}
        className="btn-brand" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
        {loading ? 'Saving...' : existingLog?.completed ? '✓ Update Meditation' : 'Complete Meditation ✓'}
      </button>
    </div>
  );
}
