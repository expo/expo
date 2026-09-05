const path = require('path');

const roots = ['__mocks__', 'src', 'metro-require'];

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots,
  moduleNameMapper: {
    // Relative dynamic imports in `src` are written with the `.js` extension of the built output,
    // so strip it to resolve the `.ts` source.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
};
