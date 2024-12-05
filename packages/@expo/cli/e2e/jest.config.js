/* eslint-env node */
const { boolish } = require('getenv');
const path = require('node:path');
const process = require('node:process');

const roots = ['../__mocks__', '.'];

/** @type {import('jest').Config} */
const config = {
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
};

// Only run 2 separate tests concurrently on CI
if (boolish('CI', false)) {
  config.maxWorkers = 2;
}

// Run tests serially when CI is running in debug mode
if (boolish('RUNNER_DEBUG', false)) {
  config.maxWorkers = 1;
}

module.exports = config;
