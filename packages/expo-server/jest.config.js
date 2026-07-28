const path = require('path');

module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  clearMocks: true,
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots: ['../@expo/cli/__mocks__', 'src'],
  setupFiles: ['<rootDir>/../@expo/cli/jest.setup.ts'],
};
