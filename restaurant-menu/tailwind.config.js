/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#f1f6f5', 100: '#dbe8e5', 200: '#b8d0cb', 300: '#8bb0a8', 400: '#5d8a81',
          500: '#3f6e65', 600: '#2f5750', 700: '#264842', 800: '#1d3834', 900: '#0f2a26',
        },
        saffron: { 100: '#fdf0d6', 400: '#f0b04a', 500: '#e59a1e', 600: '#c77f0f' },
        paper: '#fafaf7',
      },
    },
  },
  plugins: [],
}
