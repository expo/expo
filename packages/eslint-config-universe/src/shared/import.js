const { jsExtensions } = require('./extensions');
const { legacyPlugin } = require('../utils/flat-config');

module.exports = {
  name: 'eslint-config-universe/shared/import',
  plugins: {
    import: legacyPlugin('eslint-plugin-import'),
  },
  rules: {
    'import/default': 'off',
    'import/export': 'error',
    'import/first': 'warn',
    'import/namespace': ['error', { allowComputed: true }],
    'import/no-duplicates': 'error',
    'import/order': [
      'warn',
      {
        groups: [['builtin', 'external'], 'internal', ['parent', 'index', 'sibling']],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
      },
    ],
  },
  settings: {
    'import/extensions': jsExtensions,
    'import/ignore': [
      // react-native's main module is Flow, not JavaScript, and raises parse errors. Additionally,
      // several other react-native-related packages still publish Flow code as their main source.
      'node_modules[\\\\/]+@?react-native',
    ],
    'import/resolver': {
      node: {
        extensions: jsExtensions,
      },
    },
  },
};
