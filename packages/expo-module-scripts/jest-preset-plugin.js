const { withWatchPlugins } = require('jest-expo/config');

module.exports = withWatchPlugins({
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: require.resolve('./babel.config.base.js') }],
  },
});
