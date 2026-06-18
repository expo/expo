// Drop the preset's `testRegex` since this config selects tests via `testMatch`
// (jest forbids using both together).
const { testRegex, ...preset } = require('expo-module-scripts/jest-preset-cli');

module.exports = {
  ...preset,
  testMatch: ['**/__tests__/**/*-test.ts'],
  coveragePathIgnorePatterns: ['testfixtures'],
  rootDir: __dirname,
  roots: ['cli'],
};
