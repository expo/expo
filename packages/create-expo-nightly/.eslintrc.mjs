import config from 'expo-module-scripts/eslintrc.base.js';

config.rules = {
  ...config.rules,
  'sort-imports': [
    'error',
    {
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
    },
  ],
  'import/extensions': ['error', 'ignorePackages'],
};

export default config;
