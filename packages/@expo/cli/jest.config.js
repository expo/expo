const path = require('path');

const roots = ['__mocks__', 'src'];

module.exports = {
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  projects: [{
    testEnvironment: 'node',
    testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
    rootDir: path.resolve(__dirname),
    displayName: require('./package').name,
    roots,
    setupFiles: ['<rootDir>/e2e/setup.ts'],
    clearMocks: true,
  }, {
    displayName: require('./package').name + "-types",
    runner: 'jest-runner-tsd',
    testRegex: '/__typetests__/.*(test|spec)\\.[jt]sx?$',
    rootDir: path.resolve(__dirname),
    roots,
    globalSetup: '<rootDir>/src/start/server/type-generation/__typetests__/generateFixtures.ts',
  }]
};
