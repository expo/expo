const expoTheme = require('@expo/styleguide/tailwind');
const merge = require('lodash/merge');

function getExpoTheme(extend = {}, plugins = [], themeOverrides = {}) {
  const customizedTheme = Object.assign({}, expoTheme);
  customizedTheme.theme = Object.assign({}, merge(expoTheme.theme, themeOverrides));
  customizedTheme.theme.extend = Object.assign({}, merge(customizedTheme.theme.extend, extend));
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
    './node_modules/@expo/styleguide-cookie-consent/dist/**/*.{js,ts,jsx,tsx}',
  ],
  ...getExpoTheme(
    {
      backgroundColor: {
        'launch-party-red': '#D22323',
        'launch-party-blue': '#006CFF',
        'launch-party-yellow': '#F3AD0D',
      },
      borderColor: {
        'palette-orange3.5': 'hsl(from var(--orange-4) h calc(s - 5) calc(l + 5));',
      },
      backgroundImage: {
        'cell-quickstart-pattern': "url('/static/images/home/QuickStartPattern.svg')",
        'cell-tutorial-pattern': "url('/static/images/home/TutorialPattern.svg')",
        'launch-party-banner': "url('/static/images/launch-party-banner-bg.svg')",
        'launch-party-banner-mobile': "url('/static/images/launch-party-banner-bg.svg') 200px",
      },
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
    },
    [],
    {
      fontSize: {
        '3xl': ['31px', { lineHeight: 1.29, letterSpacing: '-0.021rem' }],
        '2xl': ['25px', { lineHeight: 1.4, letterSpacing: '-0.021rem' }],
        xl: ['20px', { lineHeight: 1.5, letterSpacing: '-0.017rem' }],
        lg: ['18px', { lineHeight: 1.5, letterSpacing: '-0.014rem' }],
        base: ['16px', { lineHeight: 1.625, letterSpacing: '-0.011rem' }],
        sm: ['15px', { lineHeight: 1.6, letterSpacing: '-0.009rem' }],
        xs: ['14px', { lineHeight: 1.57, letterSpacing: '-0.006rem' }],
        '2xs': ['13px', { lineHeight: 1.61, letterSpacing: '-0.003rem' }],
        '3xs': ['12px', { lineHeight: 1.58 }],
      },
      heading: {
        '5xl': {
          fontSize: '61px',
          lineHeight: 1.2,
          letterSpacing: '-0.022rem',
        },
        '4xl': {
          fontSize: '49px',
          lineHeight: 1.2,
          letterSpacing: '-0.022rem',
        },
        '3xl': {
          fontSize: '39px',
          lineHeight: 1.3,
          letterSpacing: '-0.022rem',
        },
        '2xl': {
          fontSize: '31px',
          lineHeight: 1.4,
          letterSpacing: '-0.021rem',
        },
        xl: {
          fontSize: '25px',
          lineHeight: 1.5,
          letterSpacing: '-0.017rem',
        },
        lg: {
          fontSize: '20px',
          lineHeight: 1.5,
          letterSpacing: '-0.017rem',
        },
        base: {
          fontSize: '16px',
          lineHeight: 1.625,
          letterSpacing: '-0.011rem',
        },
        sm: {
          fontSize: '14.4px',
          lineHeight: 1.61,
          letterSpacing: '-0.003rem',
        },
        xs: {
          fontSize: '12.8px',
          lineHeight: 1.58,
        },
      },
    }
  ),
};
