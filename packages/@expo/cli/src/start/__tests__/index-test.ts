import { expoStart } from '../index';

jest.mock('../../utils/args', () => ({
  assertArgs: jest.fn(),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock('../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), { virtual: true });
jest.mock('../../utils/errors', () => ({ logCmdError: jest.fn() }));
jest.mock('../resolveOptions.js', () => ({ resolveOptionsAsync: jest.fn(async () => ({})) }), {
  virtual: true,
});
jest.mock('../startAsync.js', () => ({ startAsync: jest.fn(async () => {}) }), { virtual: true });

const { assertArgs } = require('../../utils/args') as { assertArgs: jest.Mock };
const { loadEnvFiles } = require('../../utils/nodeEnv.js') as { loadEnvFiles: jest.Mock };
const { resolveOptionsAsync } = require('../resolveOptions.js') as {
  resolveOptionsAsync: jest.Mock;
};

it.each([
  { noDev: false, mode: 'development' },
  { noDev: true, mode: 'production' },
])('loads $mode env files before resolving start options', async ({ noDev, mode }) => {
  assertArgs.mockReturnValue({ '--no-dev': noDev });

  await expoStart([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    resolveOptionsAsync.mock.invocationCallOrder[0]!
  );
});

describe('tunnel arguments', () => {
  beforeEach(() => {
    assertArgs.mockImplementation(jest.requireActual('../../utils/args').assertArgs);
  });

  it.each([
    { argv: ['--tunnel'], provider: 'expo', positional: [] },
    { argv: ['--tunnel', 'ngrok'], provider: 'ngrok', positional: [] },
    { argv: ['--tunnel=ngrok'], provider: 'ngrok', positional: [] },
    { argv: ['--tunnel', 'expo'], provider: 'expo', positional: [] },
    {
      argv: ['my-app', '--tunnel', 'ngrok'],
      provider: 'ngrok',
      positional: ['my-app'],
    },
    {
      argv: ['--tunnel', 'ngrok', 'my-app'],
      provider: 'ngrok',
      positional: ['my-app'],
    },
    { argv: ['--tunnel', 'my-app'], provider: 'expo', positional: ['my-app'] },
    { argv: ['--tunnel', '--clear'], provider: 'expo', positional: [] },
    {
      argv: ['--', '--tunnel', 'ngrok'],
      provider: undefined,
      positional: ['--tunnel', 'ngrok'],
    },
  ])('parses $argv', async ({ argv, provider, positional }) => {
    await expoStart(argv);
    expect(resolveOptionsAsync).toHaveBeenLastCalledWith(
      '/app',
      expect.objectContaining({
        _: positional,
        ...(provider ? { '--tunnel': provider } : {}),
      })
    );
    expect(resolveOptionsAsync.mock.calls.at(-1)[1]['--tunnel']).toBe(provider);
  });
});
