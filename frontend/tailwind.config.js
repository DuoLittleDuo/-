/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        clay: '#B85C38',
        'clay-dark': '#9A4728',
        'clay-light': '#D98B6A',
        ink: '#3D2B24',
        sand: '#F5EBDD',
        cream: '#FFF9F0',
        celadon: '#7F9381',
        gold: '#C79A52',
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', '"SimSun"', 'serif'],
        body: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 32px -18px rgba(61, 43, 36, 0.35)',
        card: '0 8px 24px -16px rgba(61, 43, 36, 0.28)',
      },
      opacity: {
        8: '0.08',
        12: '0.12',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        24: '0.24',
        28: '0.28',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        68: '0.68',
        85: '0.85',
        88: '0.88',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
