import { expoExportEmbed } from '../index';

jest.mock('../../../utils/args', () => ({
  assertWithOptionsArgs: jest.fn(() => ({})),
  printHelp: jest.fn(),
}));
jest.mock('../../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), {
  virtual: true,
});
jest.mock('../../../utils/errors.js', () => ({ logCmdError: jest.fn() }), { virtual: true });
jest.mock('../../../utils/resolveArgs.js', () => ({ resolveCustomBooleanArgsAsync: jest.fn() }), {
  virtual: true,
});
jest.mock('../resolveOptions.js', () => ({ resolveOptions: jest.fn() }), { virtual: true });
jest.mock('../exportEmbedAsync.js', () => ({ exportEmbedAsync: jest.fn(async () => {}) }), {
  virtual: true,
});

const { loadEnvFiles } = require('../../../utils/nodeEnv.js') as {
  loadEnvFiles: jest.Mock;
};
const { resolveCustomBooleanArgsAsync } = require('../../../utils/resolveArgs.js') as {
  resolveCustomBooleanArgsAsync: jest.Mock;
};
const { resolveOptions } = require('../resolveOptions.js') as {
  resolveOptions: jest.Mock;
};

beforeEach(() => {
  resolveOptions.mockReturnValue({});
});

it.each([
  { dev: undefined, mode: 'development' },
  { dev: false, mode: 'production' },
])('loads $mode env files before resolving export:embed options', async ({ dev, mode }) => {
  resolveCustomBooleanArgsAsync.mockResolvedValue({
    projectRoot: '/app',
    args: { '--dev': dev },
  });

  await expoExportEmbed([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    resolveOptions.mock.invocationCallOrder[0]!
  );
});
