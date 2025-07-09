const config = require('expo-module-scripts/eslintrc.base.js');

config.rules = {
  ...config.rules,
  'sort-imports': ['error', { 'ignoreDeclarationSort': true }],
};

module.exports = config;
