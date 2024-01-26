/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  clearMocks: true,
  displayName: require('./package').name,
  rootDir: __dirname,
  roots: ['../cli/__mocks__', 'src'],
  setupFiles: ['<rootDir>/../cli/e2e/setup.ts'],
};
