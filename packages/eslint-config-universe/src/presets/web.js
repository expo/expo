const globals = require('globals');

module.exports = [
  require('../shared/core'),
  ...require('../shared/typescript'),
  require('../shared/react'),
  require('../shared/prettier'),
  {
    name: 'eslint-config-universe/preset/web',
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
      },
    },
  },
];
