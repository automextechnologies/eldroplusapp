/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#34D399',
          500: '#00A86B', // Eldroplus Brand Emerald
          600: '#00915C',
          700: '#007A4D',
          800: '#00633E',
          900: '#064E3B',
          950: '#022C22',
        },
        apple: {
          blue: '#0071E3',
          'blue-hover': '#0077ED',
          dark: '#1D1D1F',
          gray: '#86868B',
          'gray-light': '#F5F5F7',
          'gray-border': '#E5E5EA',
          card: '#FFFFFF',
          green: '#00A86B',
          orange: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
          indigo: '#5856D6',
          teal: '#30B0C7',
        },
        surface: '#F5F5F7',
        card: '#FFFFFF',
        muted: '#86868B',
        border: '#E5E5EA',
        yoga:       '#00A86B',
        meditation: '#AF52DE',
        water:      '#0071E3',
        protein:    '#FF9500',
        sleep:      '#5856D6',
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro"', 'Inter', 'sans-serif'],
        body:    ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro"', 'Inter', 'sans-serif'],
        mono:    ['"SF Mono"', '"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 12px 30px rgba(0, 0, 0, 0.07), 0 4px 10px rgba(0, 0, 0, 0.03)',
        'btn': '0 2px 8px rgba(0, 168, 107, 0.25)',
        'brand': '0 4px 16px rgba(0, 168, 107, 0.28)',
        'apple-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-card': '0 2px 12px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'apple-float': '0 12px 36px -4px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.03)',
        'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
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
          '0%,100%': { boxShadow:'0 0 0 0 rgba(132,180,156,0.4)' },
          '50%':     { boxShadow:'0 0 0 10px rgba(132,180,156,0)' },
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
