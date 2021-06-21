const tailwindColors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  purge: [
    './kuick/templates/**/*.html.jinja',
    './src/**/*.{js,ts,tsx}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      backgroundImage: {
        'parkay-green-400/40': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='${encodeURIComponent(tailwindColors.green[400])}' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
