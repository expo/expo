/* eslint-env node */
const { boolish } = require('getenv');
const path = require('node:path');
const process = require('node:process');

const roots = ['../__mocks__', '.'];

/** @type {import('jest').Config} */
module.exports = withMaxWorkersByPlatform({
  testEnvironment: 'node',
  preset: 'ts-jest',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  rootDir: path.resolve(__dirname),
  displayName: require('../package').name,
  roots,
  setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.ts')],
  // Configure the global jest timeout to 3m, on Windows increase this to 5m
  testTimeout: process.platform === 'win32' ? 300_000 : 180_000,
});

/**
 * Windows suffers a lot from IO congestion when running multiple tests at once.
 * Set the max workers to 2 on CI, or 1 when CI is running in debug mode
 *
 * @param {import('jest').Config} config
 * @returns {import('jest').Config}
 */
function withMaxWorkersByPlatform(config) {
  if (boolish('CI', false)) {
    // Set max workers to 2 for Windows on CI
    if (process.platform === 'win32') {
      config.maxWorkers = 2;
    }
    // Run test serially when running on CI in debug mode
    if (boolish('RUNNER_DEBUG', false)) {
      config.maxWorkers = 1;
    }
  }

  return config;
}
