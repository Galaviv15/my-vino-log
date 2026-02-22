export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#faf5f3',
          100: '#f5ebe7',
          200: '#ead7cf',
          300: '#dfc3b7',
          500: '#a8515d',
          600: '#8b3f48',
          700: '#6b2e36',
          800: '#4b1f25',
          900: '#2b1118',
        },
        cream: '#f5f1ed',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
      },
    },
  },
  plugins: [],
  important: true,
}
