module.exports = {
  plugins: ['expo'],
  ignorePatterns: [
    // JS files can end up in build intermediates, eg:
    // android/app/build/intermediates/assets/debug/EXDevMenuApp.android.js
    'android/app/build',
  ],
  rules: {
    'expo/use-dom-exports': ['error'],
    'expo/no-env-var-destructuring': ['error'],
    'expo/no-dynamic-env-var': ['error'],
  },
};
