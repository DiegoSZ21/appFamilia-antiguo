/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'electric-blue': '#5196fe',
        'ember-orange': '#f9754e',
        'ink-black': '#1b1d20',
        midnight: '#101828',
        'paper-white': '#ffffff',
        parchment: '#f2f1ec',
        sand: '#e1dfd8',
        graphite: '#27272a',
        steel: '#6e6e6e',
        ash: '#797876',
        fog: '#a3a3a3',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'parker-md': '0px 2px 10px 0px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
