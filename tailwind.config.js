/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      colors: {
        dark: {
          950: '#060608',
          900: '#0A0A0F',
          800: '#0E0E14',
          700: '#12121B',
        }
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
