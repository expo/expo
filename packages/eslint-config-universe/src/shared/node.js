const globals = require('globals');

const { legacyPlugin } = require('../utils/flat-config');

module.exports = {
  name: 'eslint-config-universe/shared/node',
  languageOptions: {
    globals: globals.node,
  },
  plugins: {
    node: legacyPlugin('eslint-plugin-node'),
  },
  rules: {
    'node/handle-callback-err': ['warn', '^(e|err|error|.+Error)$'],
    'node/no-path-concat': 'warn',
    'node/no-new-require': 'warn',
  },
};
