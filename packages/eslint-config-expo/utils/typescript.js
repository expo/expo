const { sourceExtensions } = require('../shared/extensions');
const { typescriptRules } = require('../shared/rules');
const { importParsers, importSettings } = require('../shared/settings');

module.exports = {
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      settings: importParsers,
    },
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      extends: ['plugin:import/typescript'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: typescriptRules,
      settings: { ...importSettings(sourceExtensions), ...importParsers },
    },
  ],
};
