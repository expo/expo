import config from 'expo-module-scripts/eslintrc.base.js';

config.rules = {
  ...config.rules,
  'sort-imports': ['error', { 'ignoreDeclarationSort': true }],
};

export default config;
