const path = require('path');

module.exports = {
  testEnvironment: 'node',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  clearMocks: true,
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
};
