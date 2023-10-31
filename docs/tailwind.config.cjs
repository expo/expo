const expoTheme = require('@expo/styleguide/tailwind');
const { merge } = require('lodash');

function getExpoTheme(extend = {}) {
  const customizedTheme = Object.assign({}, expoTheme);
  customizedTheme.theme.extend = Object.assign({}, merge(expoTheme.theme.extend, extend));
  return customizedTheme;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './ui/foundations/**/*.{js,ts,jsx,tsx}',
    './ui/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@expo/styleguide/dist/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
  ...getExpoTheme(
    {
      backgroundImage: (theme) => ({
        'default-fade': `linear-gradient(to bottom, ${theme(
          'backgroundColor.default'
        )}, transparent)`,
      }),
    },
  ),
};
