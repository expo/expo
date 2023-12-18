module.exports = {
  extends: ['../../../node_modules/expo-module-scripts/eslintrc.base.js'],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/__e2e__/**', '**/__mocks__/**', '**/__tests__/**'],
      },
    ],
  },
};
