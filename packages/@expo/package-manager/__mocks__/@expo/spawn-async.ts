import { mockSpawnPromise } from '../../src/__tests__/spawn-utils';

const actualModule = jest.requireActual('@expo/spawn-async');

module.exports = {
  ...actualModule,
  __esModule: true,
  // minimal implementation is needed here because the packager manager depends on the child property to exist.
  // Note that `{ type: '<type>' }` stubs can be used in tests to assert the resolved values.
  default: jest.fn((_command, _args, _options) => {
    return mockSpawnPromise();
  }),
};
