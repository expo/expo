/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,tsx,ts,jsx}',
    './src/**/*.{js,tsx,ts,jsx}',
    './app/**/*.{js,tsx,ts,jsx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
};
