module.exports = {
  name: 'expo/eslint/jest',
  files: ['**/__tests__/**/*{.,-}test.*'],
  languageOptions: {
    globals: {
      afterAll: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      beforeEach: 'readonly',
      describe: 'readonly',
      expect: 'readonly',
      fit: 'readonly',
      it: 'readonly',
      jest: 'readonly',
      test: 'readonly',
      xdescribe: 'readonly',
      xit: 'readonly',
      xtest: 'readonly',
    },
  },
};
