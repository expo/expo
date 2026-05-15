/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  clearMocks: true,
  displayName: require('./package').name,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  rootDir: __dirname,
  roots: ['src'],
  fakeTimers: {
    enableGlobally: true,
    doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
  },
};
