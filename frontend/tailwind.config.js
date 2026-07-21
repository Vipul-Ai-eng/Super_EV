module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./components/**/*.js",
    "./**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'surface-low': '#0b1210',
        'primary': {
          400: '#3ddc97',
          500: '#2ecb88',
        }
      }
    }
  },
  plugins: [],
}