/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  preset: 'ts-jest',
  displayName: require('../package').name,
  rootDir: __dirname,
  roots: ['.'],
};
