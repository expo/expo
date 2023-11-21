/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: require.resolve('./babel.config.cli.js') }],
  },
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
};
