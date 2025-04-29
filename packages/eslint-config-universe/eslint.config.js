const { defineConfig } = require('eslint/config');
const globals = require('globals');

const coreConfig = require('./flat/shared/core.js');
const prettierConfig = require('./flat/shared/prettier.js');
const typescriptConfig = require('./flat/shared/typescript.js');

module.exports = defineConfig([
  coreConfig,
  typescriptConfig,
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ['**/__tests__/fixtures/*'],
  },
]);
