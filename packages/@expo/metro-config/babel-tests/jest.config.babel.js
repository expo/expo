/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  clearMocks: true,
  displayName: require('../package').name,
  testRegex: '/.*(test|spec)\\.[jt]sx?$',
};
