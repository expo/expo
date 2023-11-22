/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  displayName: require('./package.json').name,
  extensionsToTreatAsEsm: ['.ts'],
  rootDir: __dirname,
};
