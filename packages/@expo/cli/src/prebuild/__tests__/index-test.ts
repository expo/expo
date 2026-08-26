import { expoPrebuild } from '../index';

jest.mock('../../utils/args', () => ({
  assertArgs: jest.fn(() => ({ '--help': false })),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock('../../utils/nodeEnv', () => ({
  getConfigEnvMode: jest.fn(() => 'development'),
  loadEnvFiles: jest.fn(),
}));
jest.mock('../../utils/errors', () => ({ logCmdError: jest.fn() }));
jest.mock('../prebuildAsync.js', () => ({ prebuildAsync: jest.fn(async () => {}) }), {
  virtual: true,
});
jest.mock(
  '../resolveOptions.js',
  () => ({
    resolvePackageManagerOptions: jest.fn(() => ({})),
    resolvePlatformOption: jest.fn(() => ['android']),
    resolveSkipDependencyUpdate: jest.fn(() => []),
  }),
  { virtual: true }
);

const { loadEnvFiles } = require('../../utils/nodeEnv') as {
  loadEnvFiles: jest.Mock;
};
const { getConfigEnvMode } = require('../../utils/nodeEnv') as {
  getConfigEnvMode: jest.Mock;
};
const { prebuildAsync } = require('../prebuildAsync.js') as {
  prebuildAsync: jest.Mock;
};

beforeEach(() => {
  getConfigEnvMode.mockReturnValue('development');
});

it('loads development env files before prebuild', async () => {
  await expoPrebuild([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    prebuildAsync.mock.invocationCallOrder[0]!
  );
});

it('uses the production mode from __EXPO_CONFIG_MODE', async () => {
  getConfigEnvMode.mockReturnValue('production');

  await expoPrebuild([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'production' });
});
