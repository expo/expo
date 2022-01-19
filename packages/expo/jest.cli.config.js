const path = require('path');

const roots = ['cli', 'bin'];

if (process.env.E2E) {
  // Only add E2E tests when explicitly enabled.
  roots.push('e2e');
}

module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots,
};
