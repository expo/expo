/** @type {import('jest').Config} */
module.exports = {
  setupFilesAfterEnv: ['./setup/setupSockets.js', './setup/setupDetox.js'],
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testTimeout: 120000,
  testMatch: ['**/*-test.native.js'],
  verbose: true,
};
