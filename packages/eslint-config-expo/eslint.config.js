const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');
const expoConfig = require('./flat');

module.exports = [
  ...expoConfig,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      'prettier/prettier': 'warn',
    },
  },
];
