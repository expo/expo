const { defineConfig } = require('eslint/config');
const nodePlugin = require('eslint-plugin-n');
const globals = require('globals');

const coreConfig = require('./shared/core.js');
const prettierConfig = require('./shared/prettier.js');
const typescriptConfig = require('./shared/typescript.js');

module.exports = defineConfig([
  {
    plugins: {
      n: nodePlugin,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      'n/no-deprecated-api': 'warn',
      'n/no-path-concat': 'warn',
    },
  },
  coreConfig,
  typescriptConfig,
  prettierConfig,
]);
