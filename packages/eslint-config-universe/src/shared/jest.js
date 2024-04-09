module.exports = {
  name: 'eslint-config-universe/shared/jest',
  files: ['*test.*'],
  languageOptions: {
    globals: {
      afterAll: true,
      afterEach: true,
      beforeAll: true,
      beforeEach: true,
      describe: true,
      expect: true,
      fit: true,
      it: true,
      jest: true,
      test: true,
      xdescribe: true,
      xit: true,
      xtest: true,
    },
  },
};
