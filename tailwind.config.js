/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cod-primary': '#2B2B2B',
        'cod-secondary': '#1A1A1A',
        'cod-accent': '#D4AF37',
        'cod-danger': '#8B0000',
        'cod-success': '#2E7D32',
        'cod-info': '#1976D2',
      },
      fontFamily: {
        'military': ['Bebas Neue', 'sans-serif'],
        'bebas': ['Bebas Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}