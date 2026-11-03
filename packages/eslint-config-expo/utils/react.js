const { reactRules } = require('../shared/rules');

module.exports = {
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
  rules: reactRules,
  settings: {
    react: { version: 'detect' },
  },
};
