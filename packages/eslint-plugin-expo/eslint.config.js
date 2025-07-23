const { defineConfig, globalIgnores } = require('eslint/config');
const universeNodeConfig = require('eslint-config-universe/flat/node');

module.exports = defineConfig([
  globalIgnores(['build/*']),
  universeNodeConfig,
  {
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
]);
