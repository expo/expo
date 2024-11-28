/* eslint-env node */
const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  rootDir: path.resolve(__dirname),
  displayName: require('../package').name,
  roots: ['../__mocks__', '.'],
  setupFilesAfterEnv: [path.resolve(__dirname, './setup.ts')],
  // Set the global timeout (2m) to allow for setting up Expo projects, and exporting them
  // Windows IO is very slow, so we need to increase this timeout (5m) for Windows
  testTimeout: process.platform === 'win32' ? 600_000 : 120_000,
  // Because most tests invoke heavy IO operations (Metro), we have to run them serially.
  // Otherwise we suffer from IO congestion which slows all tests down
  maxWorkers: 1,
};
