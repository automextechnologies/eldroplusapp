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
    // Sleep for day N is the log for that dayNumber or forDay
    const log = logs.find((l) => l.taskId === 'sleep' && (l.dayNumber === day || l.forDay === day));
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
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <p className="text-[10px] font-semibold text-[#86868B] mb-0.5 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold font-mono text-[#1D1D1F]">
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
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl rounded-none md:rounded-3xl border-t-0 border-x-0 md:border border-black/[0.06] shadow-2xs mb-6">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/[0.04] active:scale-95 transition-all text-[#1D1D1F]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="font-display font-bold text-lg text-[#1D1D1F] tracking-tight">Your Analytics</p>
            <p className="text-xs text-[#86868B] font-medium">Progress over time</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
        
        {/* Sleep Chart */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#5856D6]">{TASK_CONFIG.sleep.icon}</span>
            <h2 className="font-display font-bold text-base text-[#1D1D1F]">Sleep Duration</h2>
          </div>
          <div className="bg-white border border-black/[0.06] rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 h-64">
            {sleepData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sleepData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sleepColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5856D6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#5856D6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#86868B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#86868B' }} />
                  <Tooltip content={<CustomTooltip unit="hrs" />} cursor={{ stroke: '#E5E5EA', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="hours" stroke="#5856D6" strokeWidth={2.5} fillOpacity={1} fill="url(#sleepColor)" activeDot={{ r: 5, strokeWidth: 0, fill: '#5856D6' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#86868B]">
                Not enough sleep data yet.
              </div>
            )}
          </div>
        </section>

        {/* Water Chart */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#0071E3]">{TASK_CONFIG.water.icon}</span>
            <h2 className="font-display font-bold text-base text-[#1D1D1F]">Water Intake</h2>
          </div>
          <div className="bg-white border border-black/[0.06] rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 h-64">
            {waterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F2" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#86868B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#86868B' }} />
                  <Tooltip content={<CustomTooltip unit="ml" />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="ml" fill="#0071E3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#86868B]">
                Not enough water data yet.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
