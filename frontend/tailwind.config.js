/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Smog-to-Clear gradient theme
        smog: {
          50:  '#f5f0e8',
          100: '#e8dcc8',
          200: '#c8b89a',
          300: '#a89060',
          400: '#8a7040',
          500: '#6b5020',   // heavy smog brown
          600: '#4a3010',
        },
        aqi: {
          good:       '#00e400',
          moderate:   '#ffff00',
          sensitive:  '#ff7e00',
          unhealthy:  '#ff0000',
          veryBad:    '#8f3f97',
          hazardous:  '#7e0023',
        },
        fresh: {
          50:  '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',  // clean air green
          600: '#388e3c',
        },
        sky: {
          light: '#e1f5fe',
          mid:   '#81d4fa',
          clear: '#29b6f6',
        },
      },
      fontFamily: {
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'smog-pulse': 'smog-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
      keyframes: {
        'smog-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

