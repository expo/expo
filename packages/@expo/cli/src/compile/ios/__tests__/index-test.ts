import { expoCompileIos } from '../index';

jest.mock('../../../utils/args', () => ({
  assertArgs: jest.fn(),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock('../../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), {
  virtual: true,
});
jest.mock('../../../utils/errors', () => ({ logCmdError: jest.fn() }));
jest.mock('../../resolveMode.js', () => ({ resolveMode: jest.fn(() => 'development') }), {
  virtual: true,
});
jest.mock('../../resolveOptions.js', () => ({ resolveOptions: jest.fn() }), { virtual: true });
jest.mock('../compileIosAsync.js', () => ({ compileIosAsync: jest.fn(async () => {}) }), {
  virtual: true,
});

const { assertArgs } = require('../../../utils/args') as { assertArgs: jest.Mock };
const { loadEnvFiles } = require('../../../utils/nodeEnv.js') as { loadEnvFiles: jest.Mock };
const { logCmdError } = require('../../../utils/errors') as { logCmdError: jest.Mock };
const { resolveMode } = require('../../resolveMode.js') as { resolveMode: jest.Mock };
const { resolveOptions } = require('../../resolveOptions.js') as { resolveOptions: jest.Mock };
const { compileIosAsync } = require('../compileIosAsync.js') as { compileIosAsync: jest.Mock };

it('loads env files in the resolved mode before resolving options', async () => {
  assertArgs.mockReturnValue({ '--prod': true, '--device': 'iPhone 18 Pro' });
  resolveMode.mockReturnValueOnce('development');

  await expoCompileIos([]);

  expect(resolveMode).toHaveBeenCalledWith({ dev: undefined, prod: true, device: 'iPhone 18 Pro' });
  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    resolveOptions.mock.invocationCallOrder[0]!
  );
});

it('compiles with the resolved options', async () => {
  const options = { mode: 'development', device: 'iPhone 18 Pro', outputDir: '/app/build' };
  assertArgs.mockReturnValue({
    '--dev': true,
    '--device': 'iPhone 18 Pro',
    '--output-dir': 'build',
  });
  resolveOptions.mockReturnValueOnce(options);

  await expoCompileIos([]);

  expect(resolveOptions).toHaveBeenCalledWith('/app', {
    mode: 'development',
    device: 'iPhone 18 Pro',
    outputDir: 'build',
  });
  expect(compileIosAsync).toHaveBeenCalledWith('/app', options);
});

it('handles env file errors', async () => {
  const error = new Error('env error');
  assertArgs.mockReturnValue({ '--dev': false });
  loadEnvFiles.mockImplementationOnce(() => {
    throw error;
  });

  await expoCompileIos([]);

  expect(logCmdError).toHaveBeenCalledWith(error);
});
