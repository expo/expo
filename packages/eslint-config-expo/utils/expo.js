const { expoRules } = require('../shared/rules');

module.exports = {
  plugins: ['expo'],
  ignorePatterns: [
    // JS files can end up in build intermediates, eg:
    // android/app/build/intermediates/assets/debug/EXDevMenuApp.android.js
    'android/app/build',
  ],
  rules: expoRules,
  overrides: [
    {
      files: ['metro.config.js'],
      env: {
        node: true,
      },
    },
  ],
};
