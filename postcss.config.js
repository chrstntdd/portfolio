const path = require('path');
const autoprefixer = require('autoprefixer');
const tailwind = require('tailwindcss');

module.exports = {
  ident: 'postcss',
  plugins: [
    tailwind(path.join(__dirname, 'node_modules/tailwindcss/defaultConfig.js')),
    autoprefixer()
  ]
};
