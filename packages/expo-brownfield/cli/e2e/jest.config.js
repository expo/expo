/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  displayName: require('../../package').name,
  rootDir: __dirname,
  roots: ['.'],
  // E2E tests can take some time to run
  testTimeout: 600000,
};
