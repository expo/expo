import { expoExport } from '../index';

jest.mock('../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), { virtual: true });
jest.mock('../../utils/resolveArgs.js', () => ({ resolveStringOrBooleanArgsAsync: jest.fn() }), {
  virtual: true,
});
jest.mock('../resolveOptions.js', () => ({ resolveOptionsAsync: jest.fn(async () => ({})) }), {
  virtual: true,
});
jest.mock('../exportAsync.js', () => ({ exportAsync: jest.fn(async () => {}) }), {
  virtual: true,
});

const { loadEnvFiles } = require('../../utils/nodeEnv.js') as {
  loadEnvFiles: jest.Mock;
};
const { resolveStringOrBooleanArgsAsync } = require('../../utils/resolveArgs.js') as {
  resolveStringOrBooleanArgsAsync: jest.Mock;
};
const { resolveOptionsAsync } = require('../resolveOptions.js') as {
  resolveOptionsAsync: jest.Mock;
};

beforeEach(() => {
  resolveStringOrBooleanArgsAsync.mockResolvedValue({
    projectRoot: '/app',
    args: { '--source-maps': false },
  });
});

it.each([
  { argv: [], mode: 'production' },
  { argv: ['--dev'], mode: 'development' },
])('loads $mode env files before resolving export options', async ({ argv, mode }) => {
  await expoExport(argv);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    resolveOptionsAsync.mock.invocationCallOrder[0]!
  );
});
