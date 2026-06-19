import React from 'react';

export const TASK_CONFIG = {
  yoga: {
    id: 'yoga',
    name: 'Yoga',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v8" />
        <path d="M5 20c2-1.5 4.5-2.5 7-2.5s5 1 7 2.5" />
        <path d="M3 21c3-2 6-2.5 9-2.5s6 .5 9 2.5" />
        <path d="M8 11c1-1 2.5-1.5 4-1.5s3 .5 4 1.5" />
        <path d="M6 14c2-1 4-1.5 6-1.5s4 .5 6 1.5" />
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21c-3.5 0-7-3-7-7.5 0-3 2.5-6 7-10.5 4.5 4.5 7 7.5 7 10.5 0 4.5-3.5 7.5-7 7.5z" />
        <path d="M12 21c-2-3-4-5-5-7s-1-4 2-6.5c3 2.5 4 4.5 4 6.5s-1 4-1 7z" />
        <path d="M12 21c2-3 4-5 5-7s1-4-2-6.5c-3 2.5-4 4.5-4 6.5s1 4 1 7z" />
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3" />
        <path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1-2.29 7.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" />
        <circle cx="12.5" cy="8.5" r="2.5" />
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
    color: '#4f46e5',
    lightBg: '#eef2ff',
    unit: 'hrs',
    required: false,
  },
};

export const TASK_ORDER = ['yoga', 'meditation', 'water', 'protein', 'sleep'];
