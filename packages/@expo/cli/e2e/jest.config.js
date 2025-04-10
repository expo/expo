/* eslint-env node */
const path = require('node:path');
const process = require('node:process');

const roots = ['../__mocks__', '.'];

/** @type {import('jest').Config} */
module.exports = {
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
