const { defineConfig } = require('eslint/config');
const globals = require('globals');

const coreConfig = require('./shared/core.js');
const prettierConfig = require('./shared/prettier.js');
const reactConfig = require('./shared/react.js');
const typescriptConfig = require('./shared/typescript.js');

module.exports = defineConfig([
  coreConfig,
  typescriptConfig,
  reactConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
      },
    },
  },
  prettierConfig,
]);
