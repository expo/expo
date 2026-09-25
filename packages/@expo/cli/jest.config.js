const path = require('path');

const roots = ['__mocks__', 'src'];

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
};
