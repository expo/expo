const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  clearMocks: true,
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots: ['../cli/__mocks__', 'src'],
  setupFiles: ['<rootDir>/../cli/jest.setup.ts'],
};
