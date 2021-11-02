/**
 * A mock of the Constants module with extra fields specified to simulate a project in development.
 * Use it by importing and returning it from a `jest.mock` call explicitly.
 */

const Constants = jest.requireActual('expo-constants').default;

const MockConstants = Object.create(Constants);
MockConstants.__rawManifest_TEST = {
  ...Constants.__rawManifest_TEST,
  executionEnvironment: 'standalone',
  developer: {
    projectRoot: '/home/test/project',
  },
  logUrl: 'https://localhost:19001/logs',
};

// @ts-ignore: change this to use "export" instead if possible
module.exports = MockConstants;
