const globals = require('globals');

const expoConfig = require('./flat');

module.exports = [
  ...expoConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['**/__tests__/fixtures/*'],
  },
];
