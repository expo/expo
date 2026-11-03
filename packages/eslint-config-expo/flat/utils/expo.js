const expo = require('eslint-plugin-expo');
const globals = require('globals');

const { expoRules } = require('../../shared/rules');

module.exports = [
  {
    // JS files can end up in build intermediates, eg:
    // android/app/build/intermediates/assets/debug/EXDevMenuApp.android.js
    ignores: ['android/app/build'],
  },
  {
    plugins: {
      expo,
    },

    rules: expoRules,
  },
  {
    files: ['**/metro.config.js'],

    languageOptions: {
      globals: globals.node,
    },
  },
];
