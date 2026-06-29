/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF5F0',
          100: '#FFE4D5',
          200: '#FFC5A8',
          300: '#FF9B72',
          400: '#FF6B40',
          500: '#E84C1E',
          600: '#D03A10',
          700: '#B02C0C',
          800: '#8C2009',
          900: '#6A1607',
        },
        surface: '#F8F9FA',
        card: '#FFFFFF',
        muted: '#6B7280',
        border: '#E5E7EB',
        yoga:       '#10B981',
        meditation: '#8B5CF6',
        water:      '#06B6D4',
        protein:    '#F97316',
        sleep:      '#6366F1',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 30px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(255, 255, 255, 0.02)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(255, 255, 255, 0.05)',
        'btn': '0 2px 4px rgba(0, 0, 0, 0.3)',
        'brand': '0 4px 20px rgba(232,76,30,.35)',
        'inner-sm': 'inset 0 1px 2px rgba(255,255,255,.05)',
      },
      animation: {
        'flicker':    'flicker 0.6s ease-in-out infinite',
        'slide-up':   'slideUp 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in':    'fadeIn 0.25s ease-out',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'check-draw': 'checkDraw 0.4s ease-out forwards',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'slide-right':'slideRight 0.3s ease-out',
        'count-up':   'fadeIn 0.5s ease-out',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity:'1', transform:'rotate(-3deg) scale(1)' },
          '50%':     { opacity:'0.85', transform:'rotate(3deg) scale(1.05)' },
        },
        slideUp: {
          from: { transform:'translateY(100%)', opacity:'0' },
          to:   { transform:'translateY(0)',    opacity:'1' },
        },
        fadeIn: {
          from: { opacity:'0', transform:'translateY(6px)' },
          to:   { opacity:'1', transform:'translateY(0)' },
        },
        scaleIn: {
          from: { transform:'scale(0.92)', opacity:'0' },
          to:   { transform:'scale(1)',    opacity:'1' },
        },
        checkDraw: {
          from: { strokeDashoffset:'24' },
          to:   { strokeDashoffset:'0' },
        },
        pulseRing: {
          '0%,100%': { boxShadow:'0 0 0 0 rgba(232,76,30,0.4)' },
          '50%':     { boxShadow:'0 0 0 10px rgba(232,76,30,0)' },
        },
        slideRight: {
          from: { transform:'translateX(-12px)', opacity:'0' },
          to:   { transform:'translateX(0)',      opacity:'1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
