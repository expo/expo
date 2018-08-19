/**
 * A mock of the Constants module with extra fields specified to simulate a project in development.
 * Use it by importing and returning it from a `jest.mock` call explicitly.
 */

const Constants = require.requireActual('expo-constants').Constants;

const MockConstants = Object.create(Constants);
MockConstants.manifest = {
  ...Constants.manifest,
  developer: {
    projectRoot: '/home/test/project',
  },
  logUrl: 'https://localhost:19001/logs',
};

module.exports = MockConstants;
