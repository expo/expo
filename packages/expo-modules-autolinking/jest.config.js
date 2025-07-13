const sharedPreset = require('expo-module-scripts/jest-preset-plugin');
module.exports = {
  ...sharedPreset,
  transformIgnorePatterns: [
    'node_modules/(?!find-up|locate-path|p-locate|p-limit|yocto-queue|unicorn-magic|path-exists)',
  ],
  roots: ['__mocks__', 'src', 'e2e'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  restoreMocks: true,
  clearMocks: true,
};
