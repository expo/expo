const path = require('path');

const enableE2E = process.env.CI || process.env.E2E;

const roots = ['cli', 'bin'];

if (enableE2E) {
  roots.push('e2e');
}

module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  // transform: {
  //   '^.+\\.[jt]sx?$': ['babel-jest', { configFile: require.resolve('./babel.config.js') }],
  // },
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots,
  //   setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
};
