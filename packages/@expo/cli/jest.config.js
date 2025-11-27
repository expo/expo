const path = require('path');

const roots = ['__mocks__', 'src', 'metro-require'];

/** @type {import('jest').Config} */
module.exports = {
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  projects: [
    {
      testEnvironment: 'node',
      testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
      rootDir: path.resolve(__dirname),
      displayName: require('./package').name,
      roots,
      setupFiles: ['<rootDir>/jest.setup.ts'],
      clearMocks: true,
      moduleNameMapper: {
        // Allow `@expo/cli` to resolve itself during tests
        '^@expo/cli/(.*)$': '<rootDir>/$1',
      },
      // Ignore packages that Jest can't handle
      transformIgnorePatterns: ['node_modules/(?!(@expo/metro|expo)/)'],
    },
  ],
};
