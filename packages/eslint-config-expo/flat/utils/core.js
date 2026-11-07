const importPlugin = require('eslint-plugin-import');

const { jsExtensions } = require('../../shared/extensions');
const { moduleGlobals } = require('../../shared/globals');
const { coreRules } = require('../../shared/rules');
const { importIgnore } = require('../../shared/settings');

module.exports = [
  importPlugin.flatConfigs.recommended,
  {
    languageOptions: {
      globals: moduleGlobals,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: true,
        },
      },
    },

    settings: {
      'import/extensions': jsExtensions,
      'import/ignore': importIgnore,
      'import/resolver': {
        node: { extensions: jsExtensions },
        typescript: true,
      },
    },

    rules: coreRules,
  },
];
