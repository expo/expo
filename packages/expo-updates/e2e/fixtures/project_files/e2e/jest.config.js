/** @type {import('jest').Config} */
module.exports = {
  setupFilesAfterEnv: [],
  preset: 'ts-jest',
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testTimeout: 100000,
  testMatch: ['./**/*.e2e.ts'],
  verbose: true,
};
