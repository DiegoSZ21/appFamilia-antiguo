/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        warm: {
          50: '#FFFBF5',
          100: '#FFF3E0',
          200: '#FFE0B2',
          500: '#F97316',
          600: '#EA580C',
        },
      },
    },
  },
  plugins: [],
};
