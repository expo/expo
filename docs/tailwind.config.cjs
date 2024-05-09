const expoTheme = require('@expo/styleguide/tailwind');
const merge = require('lodash/merge');
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
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './ui/foundations/**/*.{js,ts,jsx,tsx}',
    './ui/components/**/*.{js,ts,jsx,tsx}',
    './scenes/**/*.{js,ts,jsx,tsx}',
    './node_modules/@expo/styleguide/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@expo/styleguide-search-ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  ...getExpoTheme(
    {
      backgroundImage: theme => ({
        'default-fade': `linear-gradient(to bottom, ${theme('backgroundColor.default')}, transparent)`,
        'default-fade-down': `linear-gradient(to bottom, transparent, ${theme('backgroundColor.default')})`,
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
        slideDownAndFade: {
          '0%': {
            opacity: 0,
            transform: 'translateY(8px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        slideRightAndFade: {
          '0%': {
            opacity: 0,
            transform: 'translateX(8px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
        slideLeftAndFade: {
          '0%': {
            opacity: 0,
            transform: 'translateX(-8px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
        slideUpAndFade: {
          '0%': {
            opacity: 0,
            transform: 'translateY(-8px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
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
        wave: {
          '0%, 100%': {
            transform: 'rotate(0deg)',
          },
          '50%': {
            transform: 'rotate(20deg)',
          },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        fadeOut: 'fadeOut 0.15s ease-in',
        slideDownAndFade: 'slideDownAndFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideRightAndFade: 'slideRightAndFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideLeftAndFade: 'slideLeftAndFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUpAndFade: 'slideUpAndFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUpAndFadeIn: 'slideUpAndFadeIn 0.25s ease-out',
        wave: 'wave 0.25s ease-in-out 4',
      },
    },
    [
      plugin(function ({ addUtilities }) {
        addUtilities({
          '.asset-shadow': {
            filter:
              'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.12)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.07))',
          },
          '.asset-sm-shadow': {
            filter:
              'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08)) drop-shadow(0 1px 4px rgba(0, 0, 0, 0.03))',
          },
          '.wrap-anywhere': {
            'overflow-wrap': 'anywhere',
          },
        });
      }),
    ]
  ),
};
