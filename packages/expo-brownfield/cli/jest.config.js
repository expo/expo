/** @type {import('jest').Config} */
module.exports = {
  ...require('../e2e/cli/jest.config.js'),
  // When expo-module-test runs "yarn test cli" it passes --rootDir cli, so Jest's
  // rootDir is cli/. Point roots at e2e/cli so the same cli tests run.
  roots: ['../e2e/cli'],
};
