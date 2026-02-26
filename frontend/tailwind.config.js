/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: 'var(--color-ink)',
        paper: 'var(--bg-primary)',
        'paper-dim': '#E5E5E5',
        emerald: '#10b981',
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.05em' }],
        'display-lg': ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.5rem, 4vw, 2.25rem)', { lineHeight: '1.15' }],
        'display-sm': ['clamp(1.25rem, 3vw, 1.5rem)', { lineHeight: '1.2' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
      },
      letterSpacing: {
        tight: '-0.03em',
        tighter: '-0.05em',
      },
      borderRadius: {
        'ed-sm': '4px',
        'ed-md': '8px',
        'ed-lg': '12px',
        'ed-xl': '20px',
        'ed-2xl': '28px',
      },
      transitionTimingFunction: {
        elastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [animate],
}
