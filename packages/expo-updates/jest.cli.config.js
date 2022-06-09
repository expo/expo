module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*-test.ts'],
  coveragePathIgnorePatterns: ['testfixtures'],
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  rootDir: __dirname,
  roots: ['cli'],
};
