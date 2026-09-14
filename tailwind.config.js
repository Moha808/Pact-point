/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f6f8fb',
          100: '#eef1f6',
          200: '#dce2eb',
          300: '#c2cbd7',
          400: '#9daabf',
          500: '#7c8ca3',
          600: '#617188',
          700: '#4f5c71',
          800: '#424d5e',
          900: '#1c222c',  // deep professional navy-gray
          950: '#0e1218',  // almost black for dark mode
        },
        teal: {
          50: '#f2f8fc',
          100: '#e1f0f7',
          200: '#c9e2ef',
          300: '#a3cce3',
          400: '#77abd2',
          500: '#548bbd',
          600: '#416e9c', // Primary corporate blue replacing teal
          700: '#35587f',
          800: '#2e4968',
          900: '#283e56',
          950: '#1a2838',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'card': '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
