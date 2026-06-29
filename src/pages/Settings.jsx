import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { calcBMI, getBMICategory } from '../utils/bmiCalc';
import db from '../db/dexie';

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-extrabold text-brand-500 uppercase tracking-widest mb-3 px-1">{title}</p>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, value, onClick, danger = false, last = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
        last ? '' : 'border-b border-gray-100'
      } ${danger ? 'text-red-600 font-bold' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
        danger ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-gray-50 border border-gray-200/50 text-gray-500'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-[15px] font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{label}</p>
        {value && <p className="text-xs text-gray-500 font-semibold mt-1">{value}</p>}
      </div>
      {!danger && (
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
        </svg>
      )}
    </button>
  );
}

export default function Settings() {
  const user = useUserStore((s) => s.user);
  const { updateUser, logout } = useUserStore();
  const api = useApi();
  const navigate = useNavigate();
  const { permission, supported, requestPermission } = useNotifications();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const bmi = calcBMI(user?.heightCm, user?.weightKg);
  const bmiCategory = getBMICategory(bmi);

  let bmiColor = 'text-gray-500';
  if (bmiCategory) {
    if (bmiCategory.label === 'Underweight') bmiColor = 'text-blue-600';
    else if (bmiCategory.label === 'Normal') bmiColor = 'text-emerald-600';
    else if (bmiCategory.label === 'Overweight') bmiColor = 'text-amber-600';
    else if (bmiCategory.label === 'Obese') bmiColor = 'text-red-600';
  }

  async function handleLogout() {
    await db.taskLogs.clear().catch(() => {});
    await db.user.clear().catch(() => {});
    logout();
    navigate('/login');
  }

  async function exportToCSV() {
    try {
      const logs = await db.taskLogs.toArray();
      if (!logs.length) return alert('No data to export.');
      
      const headers = ['dayNumber', 'date', 'taskId', 'completed', 'amount', 'unit'];
      const csvContent = [
        headers.join(','),
        ...logs.map(l => [l.dayNumber, l.date, l.taskId, l.completed, l.amount || 0, l.unit || ''].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'eldroplus_health_data.csv';
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to export data');
    }
  }

  if (!user) return null;

  const initials = user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-surface md:p-4 pb-12">

      {/* Header */}
      <div 
        className="px-5 pt-14 pb-20 md:py-10 md:rounded-3xl relative overflow-hidden mb-6 border border-brand-500/10"
        style={{ background: 'linear-gradient(135deg, #FFF0EB 0%, #FFE0D6 100%)' }}
      >
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/10 blur-md pointer-events-none" />
        <div className="absolute top-10 -left-8 w-28 h-28 rounded-full bg-black/5 blur-xl pointer-events-none" />
        <h1 className="relative font-display font-extrabold text-2xl text-brand-950">Profile</h1>
        <p className="relative text-brand-700 text-sm mt-0.5">Manage your account</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Avatar card */}
        <div className="px-4 md:px-0 -mt-8 md:mt-0 mb-6">
          <div className="premium-card p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner-sm"
                 style={{ background: 'linear-gradient(135deg, #FF6B40 0%, #E84C1E 100%)' }}>
              <span className="font-display font-extrabold text-2xl text-white">{initials}</span>
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-lg text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500 font-semibold">{user.phone}</p>
              <p className="text-xs text-brand-500 font-semibold mt-1">
                Started {user.startDate ? new Date(user.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="px-4 md:px-0 pb-28 md:pb-8 grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
          
          {/* Left Column */}
          <div className="space-y-6">
            {/* Stats */}
            {(bmi || user.heightCm || user.weightKg) && (
              <Section title="Body Stats">
                <div className="px-5 py-4 grid grid-cols-3 gap-4">
                  {user.heightCm && (
                    <div className="text-center">
                      <p className="font-mono font-bold text-xl text-gray-900">{user.heightCm}</p>
                      <p className="text-xs text-gray-500 mt-0.5">cm height</p>
                    </div>
                  )}
                  {user.weightKg && (
                    <div className="text-center">
                      <p className="font-mono font-bold text-xl text-gray-900">{user.weightKg}</p>
                      <p className="text-xs text-gray-500 mt-0.5">kg weight</p>
                    </div>
                  )}
                  {bmi && (
                    <div className="text-center">
                      <p className={`font-mono font-bold text-xl ${bmiColor}`}>{bmi.toFixed(1)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">BMI · {bmiCategory?.label}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Account */}
            <Section title="Account">
              <Row
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
                label="Edit profile"
                value="Name, age, body metrics"
                onClick={() => {}}
              />
              <Row
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2.5 2.5 0 00-5 0v3m0 0V15a2 2 0 01-2 2H7v1.5a1.5 1.5 0 01-3 0V15m3 0V9a4 4 0 017.5-2z" />
                  </svg>
                }
                label="Change password"
                onClick={() => {}}
                last
              />
            </Section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Notifications */}
            <Section title="Notifications">
              {!supported ? (
                <div className="px-5 py-4 text-sm text-gray-500">Push notifications not supported.</div>
              ) : permission === 'granted' ? (
                <Row
                  icon={
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  }
                  label="Reminders active"
                  value="Daily health reminders enabled"
                  last
                />
              ) : (
                <Row
                  icon={
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-3.86 0-7-3.14-7-7 0-1.12.26-2.18.73-3.12M8 4.25a7.1 7.1 0 014-.75c3.86 0 7 3.14 7 7 0 .54-.06 1.07-.18 1.58M3 3l18 18" />
                    </svg>
                  }
                  label="Enable reminders"
                  value="Tap to allow daily task notifications"
                  onClick={requestPermission}
                  last
                />
              )}
            </Section>

            {/* Data */}
            <Section title="Data">
              <Row
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                label="Export Data"
                value="Download your logs as CSV"
                onClick={exportToCSV}
                last
              />
            </Section>

            {/* Danger */}
            <Section title="Danger Zone">
              <Row
                icon={
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
                label="Sign out"
                onClick={handleLogout}
                danger
                last
              />
            </Section>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 pt-2 pb-6 md:pb-0">HealthX · 30-Day Challenge · v1.0</p>
      </div>
    </div>
  );
}
