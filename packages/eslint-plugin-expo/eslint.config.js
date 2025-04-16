const { defineConfig } = require('eslint/config');
const universeNodeConfig = require('eslint-config-universe/node');

module.exports = defineConfig([
  universeNodeConfig,
  {
    ignores: ['build/*'],
  },
]);
