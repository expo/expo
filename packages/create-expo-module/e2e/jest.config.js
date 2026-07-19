const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  testEnvironment: 'node',
  testTimeout: 1000 * 60 * 5, // e2e tests can be slow, default to 5m (module creation includes npm install)
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  rootDir: path.resolve(__dirname),
  displayName: require('../package').name,
  roots: ['.'],
};
