import { expoPrebuild } from '../index';

jest.mock('../../utils/args', () => ({
  assertArgs: jest.fn(() => ({ '--help': false })),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock(
  '../../utils/nodeEnv.js',
  () => ({
    getConfigEnvMode: jest.fn(() => 'development'),
    loadEnvFiles: jest.fn(),
  }),
  {
    virtual: true,
  }
);
jest.mock('../../utils/errors.js', () => ({ logCmdError: jest.fn() }), {
  virtual: true,
});
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

const { loadEnvFiles } = require('../../utils/nodeEnv.js') as {
  loadEnvFiles: jest.Mock;
};
const { getConfigEnvMode } = require('../../utils/nodeEnv.js') as {
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

it('uses the production mode from EXPO_CONFIG_MODE', async () => {
  getConfigEnvMode.mockReturnValue('production');

  await expoPrebuild([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'production' });
});
