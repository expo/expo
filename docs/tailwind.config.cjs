const expoTheme = require('@expo/styleguide/tailwind');
const merge = require('lodash/merge');

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
  ...getExpoTheme({
    backgroundColor: {
      'launch-party-red': '#D22323',
      'launch-party-blue': '#006CFF',
      'launch-party-yellow': '#F3AD0D',
    },
    borderColor: {
      'palette-orange3.5': 'hsl(from var(--orange-4) h calc(s - 5) calc(l + 5));',
    },
    backgroundImage: () => ({
      'cell-quickstart-pattern': "url('/static/images/home/QuickStartPattern.svg')",
      'cell-tutorial-pattern': "url('/static/images/home/TutorialPattern.svg')",
      'launch-party-banner': "url('/static/images/launch-party-banner-bg.svg')",
      'launch-party-banner-mobile': "url('/static/images/launch-party-banner-bg.svg') 200px",
    }),
    keyframes: {
      wave: {
        '0%, 100%': {
          transform: 'rotate(0deg)',
        },
        '50%': {
          transform: 'rotate(20deg)',
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
      slideUpAndFadeIn: 'slideUpAndFadeIn 0.25s ease-out',
      wave: 'wave 0.25s ease-in-out 4',
    },
  }),
};
