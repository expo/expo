/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  transform: require('./jest-swc-transform.cjs'),
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
  // See: https://jestjs.io/docs/configuration#prettierpath-string
  prettierPath: require.resolve('jest-snapshot-prettier'),
};
