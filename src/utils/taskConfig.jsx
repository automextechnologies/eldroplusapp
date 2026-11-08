import React from 'react';

export const TASK_CONFIG = {
  yoga: {
    id: 'yoga',
    name: 'Yoga & Fitness',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 7v5.5" />
        <path d="M7 11.5c1.8-1.5 3.3-2 5-2s3.2.5 5 2" />
        <path d="M5.5 19.5c2.2-2 4.2-3 6.5-3s4.3 1 6.5 3" />
        <path d="M4 21c2.5-1.5 5-2 8-2s5.5.5 8 2" />
      </svg>
    ),
    color: '#00A86B',
    lightBg: '#E8F8F0',
    unit: 'min',
    required: true,
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4c1.8 3.5 3.5 6 3.5 8.5a3.5 3.5 0 0 1-7 0C8.5 10 10.2 7.5 12 4z" />
        <path d="M12 12.5c2.5-2 5-2.5 7-1 1.2 1 1 3.5-1 5-2.2 1.6-4.2 1.5-6 1" />
        <path d="M12 12.5c-2.5-2-5-2.5-7-1-1.2 1-1 3.5 1 5 2.2 1.6 4.2 1.5 6 1" />
        <path d="M7.5 19.5c3 1.2 6 1.2 9 0" />
      </svg>
    ),
    color: '#AF52DE',
    lightBg: '#FAF5FF',
    unit: 'min',
    required: true,
  },
  water: {
    id: 'water',
    name: 'Water Intake',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.75C12 2.75 6 10.2 6 15a6 6 0 0 0 12 0c0-4.8-6-12.25-6-12.25Z" />
        <path d="M9.5 15.5a2.5 2.5 0 0 0 2.5 2.5" strokeWidth={1.75} />
      </svg>
    ),
    color: '#0071E3',
    lightBg: '#F0F9FF',
    unit: 'ml',
    required: true,
  },
  protein: {
    id: 'protein',
    name: 'Protein',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M12 9c3.5-2.5 6.5-1.5 7.5 1.5 1 3-1.5 5.5-7.5 5.5" />
        <path d="M12 15c-3.5 2.5-6.5 1.5-7.5-1.5-1-3 1.5-5.5 7.5-5.5" />
      </svg>
    ),
    color: '#FF9500',
    lightBg: '#FFF7ED',
    unit: 'g',
    required: true,
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9.006 9.006 0 0 0 12 3Z" />
        <path d="m19 5-.5 1.5L17 7l1.5.5L19 9l.5-1.5L21 7l-1.5-.5Z" strokeWidth={1.5} />
      </svg>
    ),
    color: '#5856D6',
    lightBg: '#EEF2FF',
    unit: 'hrs',
    required: false,
  },
};

// 'protein' is temporarily disabled
export const TASK_ORDER = ['yoga', 'meditation', 'water', 'sleep'];
