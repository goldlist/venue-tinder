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
        card: '#141414',
        surface: '#1a1a1a',
        border: '#2a2a2a',
        gold: '#d4a853',
        'gold-light': '#e8c47a',
      },
    },
  },
  plugins: [],
}
