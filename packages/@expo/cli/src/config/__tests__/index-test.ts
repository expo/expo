import { expoConfig } from '../index';

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
jest.mock('../configAsync.js', () => ({ configAsync: jest.fn(async () => {}) }), {
  virtual: true,
});

const { loadEnvFiles } = require('../../utils/nodeEnv') as {
  loadEnvFiles: jest.Mock;
};
const { getConfigEnvMode } = require('../../utils/nodeEnv') as {
  getConfigEnvMode: jest.Mock;
};
const { assertArgs } = require('../../utils/args') as {
  assertArgs: jest.Mock;
};
const { configAsync } = require('../configAsync.js') as {
  configAsync: jest.Mock;
};

describe('config mode', () => {
  beforeEach(() => {
    getConfigEnvMode.mockReturnValue('development');
    assertArgs.mockReturnValue({ '--help': false });
  });

  it('loads development env files before evaluating config', async () => {
    await expoConfig([]);

    expect(loadEnvFiles).toHaveBeenCalledWith(
      '/app',
      expect.objectContaining({ mode: 'development' })
    );
    expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
      configAsync.mock.invocationCallOrder[0]!
    );
  });

  it('uses the production mode from __EXPO_CONFIG_MODE', async () => {
    getConfigEnvMode.mockReturnValue('production');

    await expoConfig([]);

    expect(loadEnvFiles).toHaveBeenCalledWith(
      '/app',
      expect.objectContaining({ mode: 'production' })
    );
  });

  it('silences env output with --json', async () => {
    assertArgs.mockReturnValue({ '--help': false, '--json': true });

    await expoConfig([]);

    expect(loadEnvFiles).toHaveBeenCalledWith('/app', {
      mode: 'development',
      silent: true,
    });
  });
});
