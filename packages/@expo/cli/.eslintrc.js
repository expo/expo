const baseConfig = require('expo-module-scripts/eslintrc.base.js');

module.exports = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          "**/__e2e__/**",
          "**/__mocks__/**",
          "**/__tests__/**",
        ]
      }
    ]
  },
};
