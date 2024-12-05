/* eslint-env node */
const { boolish } = require('getenv');
const path = require('node:path');
const process = require('node:process');

const roots = ['../__mocks__', '.'];

/** @type {import('jest').Config} */
module.exports = withMaxWorkersForCI({
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
 * CI may suffer from IO congestion when running parallel tests.
 * This turns off parallel testing on CI, instead we use test sharding to speed up the tests.
 *
 * @param {import('jest').Config} config
 * @returns {import('jest').Config}
 */
function withMaxWorkersForCI(config) {
  if (boolish('CI', false)) {
    config.maxWorkers = 1;
  }

  return config;
}
