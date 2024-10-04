const expoTheme = require('@expo/styleguide/tailwind');
const { merge } = require('lodash');
const plugin = require('tailwindcss/plugin');

function getExpoTheme(extend = {}, plugins = []) {
  const customizedTheme = Object.assign({}, expoTheme);
  customizedTheme.theme.extend = Object.assign({}, merge(expoTheme.theme.extend, extend));
  customizedTheme.plugins = [...expoTheme.plugins, ...plugins];
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
    './node_modules/@expo/styleguide-search-ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  ...getExpoTheme({
    backgroundImage: theme => ({
      'default-fade': `linear-gradient(to bottom, ${theme(
        'backgroundColor.default'
      )}, transparent)`,
      appjs: "url('/static/images/appjs.svg'), linear-gradient(#0033cc, #0033cc)",
    }),
    fontSize: {
      inherit: [
        'inherit',
        {
          lineHeight: 'inherit',
          letterSpacing: 'inherit',
          fontWeight: 'inherit',
        },
      ],
    },
    keyframes: {
      fadeIn: {
        '0%': {
          opacity: 0,
        },
        '100%': {
          opacity: 1,
        },
      },
      fadeOut: {
        '0%': {
          opacity: 1,
        },
        '100%': {
          opacity: 0,
        },
      },
      slideUpAndFadeIn: {
        '0%': {
          opacity: 0,
          transform: 'translateY(16px)',
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
    },
    animation: {
      fadeIn: 'fadeIn 0.25s ease-out',
      fadeOut: 'fadeOut 0.15s ease-in',
      slideUpAndFadeIn: 'slideUpAndFadeIn 0.25s ease-out',
    },
  },
  [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.wrap-anywhere': {
          'overflow-wrap': 'anywhere',
        },
      });
    }),
  ]),
};
