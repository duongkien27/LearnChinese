/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        cn: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#e11d48',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
