/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  corePlugins: {
    preflight: false // Crucial: Never override Bootstrap's CSS reset
  },
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D6001C',
          darkred: '#B30017',
          black: '#111111',
          dark: '#1A1A1A',
          gray: '#666666',
          lightgray: '#F5F5F5',
          border: '#E5E5E5'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Montserrat', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)'
      }
    }
  },
  plugins: []
};
