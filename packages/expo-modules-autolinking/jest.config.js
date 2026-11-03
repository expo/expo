const sharedPreset = require('@expo/internal-scripts/jest-preset-plugin');
module.exports = {
  ...sharedPreset,
  roots: ['__mocks__', 'src', 'e2e'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  restoreMocks: true,
  clearMocks: true,
};
