/** @type {import('jest').Config} */
module.exports = {
  ...require('@expo/internal-scripts/jest-preset-cli'),
  clearMocks: true,
  displayName: require('./package').name,
  rootDir: __dirname,
  setupFilesAfterEnv: ['./jest.setup.js'],
};
