/** @type {import('jest').Config} */
module.exports = {
  ...require('@expo/internal-scripts/jest-preset-cli.js'),
  clearMocks: true,
  displayName: require('./package').name,
  rootDir: __dirname,
  roots: ['__mocks__', 'src'],
};
