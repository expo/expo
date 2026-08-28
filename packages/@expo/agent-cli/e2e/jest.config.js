/* eslint-env node */
const path = require('node:path');
const process = require('node:process');

/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  rootDir: path.resolve(__dirname),
  displayName: 'agent-cli-e2e',
  roots: ['__tests__'],
  // The fixtures ship committed `node_modules` directories as test data. Jest must never treat
  // them as modules of this project, or it reports duplicate package name collisions.
  modulePathIgnorePatterns: ['<rootDir>/fixtures/'],
  // Configure the global jest timeout to 3m, on Windows increase this to 5m
  testTimeout: process.platform === 'win32' ? 300_000 : 180_000,
};
