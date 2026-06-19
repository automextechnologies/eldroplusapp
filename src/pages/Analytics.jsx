import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie';
import { useUserStore } from '../store/useUserStore';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { TASK_CONFIG } from '../utils/taskConfig';

export default function Analytics() {
  const navigate = useNavigate();
  const currentDayNumber = useUserStore((s) => s.currentDayNumber)();

  // Fetch all completed task logs from Dexie
  const logs = useLiveQuery(() => db.taskLogs.where('completed').equals(1).toArray(), []);

  if (!logs) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="skeleton w-16 h-16 rounded-full" />
      </div>
    );
  }

  // 1. Process Sleep Data
  const sleepData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    // Sleep for day N is the log where forDay === N
    const log = logs.find((l) => l.taskId === 'sleep' && l.forDay === day);
    return {
      day: `Day ${day}`,
      hours: log ? log.amount : null,
    };
  }).filter((d) => d.hours !== null); // Only show days with logged sleep

  // 2. Process Water Data
  const waterData = Array.from({ length: currentDayNumber }, (_, i) => {
    const day = i + 1;
    const log = logs.find((l) => l.taskId === 'water' && l.dayNumber === day);
    return {
      day: `Day ${day}`,
      ml: log ? log.amount : 0,
    };
  });

  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div className="premium-glass p-3 !rounded-xl">
          <p className="text-xs font-medium text-muted mb-1">{label}</p>
          <p className="text-sm font-bold text-gray-900">
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface md:p-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 premium-glass rounded-none md:rounded-3xl border-t-0 border-x-0 md:border border-white/20 shadow-sm mb-6">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="font-display font-extrabold text-lg text-gray-900">Your Analytics</p>
            <p className="text-xs text-muted">Progress over time</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
        
        {/* Sleep Chart */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-indigo-600">{TASK_CONFIG.sleep.icon}</span>
            <h2 className="font-display font-bold text-lg text-gray-900">Sleep Duration</h2>
          </div>
          <div className="premium-card p-4 h-64">
            {sleepData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sleepData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sleepColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip content={<CustomTooltip unit="hrs" />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#sleepColor)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted">
                Not enough sleep data yet.
              </div>
            )}
          </div>
        </section>

        {/* Water Chart */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sky-600">{TASK_CONFIG.water.icon}</span>
            <h2 className="font-display font-bold text-lg text-gray-900">Water Intake</h2>
          </div>
          <div className="premium-card p-4 h-64">
            {waterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip content={<CustomTooltip unit="ml" />} cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="ml" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted">
                Not enough water data yet.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
