module.exports = [
  require('../shared/core'),
  require('../shared/import'),
  require('../shared/jest'),
  require('../shared/node'),
  {
    name: 'eslint-config-universe/preset/node',
    rules: {
      'no-buffer-constructor': 'warn',
    },
  },
];
