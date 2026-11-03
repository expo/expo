const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');

const { sourceExtensions } = require('../../shared/extensions');
const { typescriptRules } = require('../../shared/rules');
const { importParsers, importSettings } = require('../../shared/settings');

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.d.ts'];

module.exports = [
  {
    ...importPlugin.flatConfigs.typescript,
    files: tsFiles,
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    settings: importParsers,
  },
  {
    files: tsFiles,

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: { ...importSettings(sourceExtensions), ...importParsers },

    rules: typescriptRules,
  },
];
