/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  ...require('jest-expo/config/maxWorkers'),
  passWithNoTests: true,
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  transform: require('./jest-swc-transform.cjs'),
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
};
