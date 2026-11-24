/** @type {import('jest').Config} */
module.exports = {
  ...require('@expo/internal-scripts/jest-preset-cli'),
  displayName: require('./package').name,
  rootDir: __dirname,
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/node_modules/'],
};
