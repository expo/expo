const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  testTimeout: 1000 * 60 * 3, // e2e tests can be slow, default to 3m
  rootDir: path.resolve(__dirname),
  displayName: require('../package').name,
  roots: ['.'],
};
