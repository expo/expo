const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  displayName: require('../../package').name,
  rootDir: __dirname,
  roots: ['.'],
  // E2E tests can take some time to run
  testTimeout: 600000,
  globalSetup: path.resolve(__dirname, '../scripts/global-setup.js'),
};
