/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0a',
        card: '#111111',
        surface: '#111111',
        border: '#222222',
        cream: '#F5F0E8',
        'like-green': '#4ade80',
        'pass-red': '#f87171',
        // legacy aliases
        gold: '#F5F0E8',
      },
    },
  },
  plugins: [],
}
