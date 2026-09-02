/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli.js'),
  clearMocks: true,
  displayName: require('./package').name,
  rootDir: __dirname,
  roots: ['__mocks__', 'src'],
  // `src/deferred/` is the v1 narrowing's reference shelf (llp/0016): code no registry entry loads,
  // with the suites that covered it. They assert against a surface this CLI no longer has, so
  // running them would fail on the deferral itself rather than on a regression.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/deferred/'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
};
