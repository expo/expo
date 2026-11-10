const { jsExtensions } = require('../shared/extensions');
const { moduleGlobals } = require('../shared/globals');
const { coreRules } = require('../shared/rules');
const { importIgnore } = require('../shared/settings');

module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
    ecmaFeatures: { impliedStrict: true, jsx: true },
  },
  env: { es2022: true },
  globals: moduleGlobals,
  extends: ['plugin:import/recommended'],
  plugins: ['import'],
  rules: coreRules,
  settings: {
    'import/extensions': jsExtensions,
    'import/ignore': importIgnore,
    'import/resolver': {
      node: { extensions: jsExtensions },
      typescript: true,
    },
  },
};
