import React from 'react';

export const TASK_CONFIG = {
  yoga: {
    id: 'yoga',
    name: 'Yoga',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 9l-2 5H8.5L7 20h2l1-4.5 2-2 2 4.5h2l-2-6 1.5-2" />
      </svg>
    ),
    color: '#16a34a',
    lightBg: '#f0fdf4',
    unit: 'min',
    required: true,
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-2.5 2.5h-1A6 6 0 012.5 16v-2.5a3 3 0 013-3h1a3 3 0 013-3V5A3 3 0 0112 2zm2.5 2.5A2.5 2.5 0 0114.5 2h1A3 3 0 0118.5 5v2.5a3 3 0 013 3h1a3 3 0 013 3V16a6 6 0 01-6 6h-1a2.5 2.5 0 01-2.5-2.5v-15z" />
      </svg>
    ),
    color: '#9333ea',
    lightBg: '#faf5ff',
    unit: 'min',
    required: true,
  },
  water: {
    id: 'water',
    name: 'Water Intake',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
      </svg>
    ),
    color: '#0284c7',
    lightBg: '#f0f9ff',
    unit: 'ml',
    required: true,
  },
  protein: {
    id: 'protein',
    name: 'Protein',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v8a5 5 0 0010 0V3M9 3v8M18 3v18M21 3v5a3 3 0 01-6 0V3" />
      </svg>
    ),
    color: '#ea580c',
    lightBg: '#fff7ed',
    unit: 'g',
    required: true,
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    color: '#4f46e5',
    lightBg: '#eef2ff',
    unit: 'hrs',
    required: false,
  },
};

export const TASK_ORDER = ['yoga', 'meditation', 'water', 'protein', 'sleep'];
