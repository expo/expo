const { defineConfig } = require('eslint/config');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  eslintPluginPrettierRecommended,
  {
    rules: {
      'prettier/prettier': ['warn'],
    },
  },
]);
