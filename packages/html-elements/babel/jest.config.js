const path = require('path');

const roots = ['.'];

module.exports = {
  testEnvironment: 'node',
  testRegex: './__tests__/.*(test|spec)\\.[jt]sx?$',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  rootDir: path.resolve(__dirname),
  displayName: require('../package').name,
  roots,
};
