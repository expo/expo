/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli.js'),
  displayName: require('./package').name,
  rootDir: __dirname,
};
