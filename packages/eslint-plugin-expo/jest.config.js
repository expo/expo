/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli.js'),
  preset: 'ts-jest',
  clearMocks: true,
  displayName: require('./package').name,
  rootDir: __dirname,
  roots: ['src'],
};
