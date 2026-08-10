import { expoExportWeb } from '../index';

jest.mock('../../../utils/args', () => ({
  assertArgs: jest.fn(),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock('../../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), {
  virtual: true,
});
jest.mock('../../../utils/errors', () => ({ logCmdError: jest.fn() }));
jest.mock('../resolveOptions.js', () => ({ resolveOptionsAsync: jest.fn(async () => ({})) }), {
  virtual: true,
});
jest.mock('../exportWebAsync.js', () => ({ exportWebAsync: jest.fn(async () => {}) }), {
  virtual: true,
});

const { assertArgs } = require('../../../utils/args') as { assertArgs: jest.Mock };
const { loadEnvFiles } = require('../../../utils/nodeEnv.js') as { loadEnvFiles: jest.Mock };
const { resolveOptionsAsync } = require('../resolveOptions.js') as {
  resolveOptionsAsync: jest.Mock;
};

it.each([
  { dev: false, mode: 'production' },
  { dev: true, mode: 'development' },
])('loads $mode env files before resolving export:web options', async ({ dev, mode }) => {
  assertArgs.mockReturnValue({ '--dev': dev });

  await expoExportWeb([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    resolveOptionsAsync.mock.invocationCallOrder[0]!
  );
});
