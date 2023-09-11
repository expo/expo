const path = require('path');

const roots = ['./src'];

const enableE2E = process.env.CI || process.env.E2E;

if (enableE2E) {
  roots.push('e2e');
}

module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots,
  testRunner: 'jest-jasmine2',
};
