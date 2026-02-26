/** @type {import('jest').Config} */
module.exports = {
  ...require('../e2e/plugin/jest.config.js'),
  // When expo-module-test runs "yarn test plugin" it passes --rootDir plugin, so Jest's
  // rootDir is plugin/. Point roots at e2e/plugin so the same plugin tests run.
  roots: ['../e2e/plugin'],
};
