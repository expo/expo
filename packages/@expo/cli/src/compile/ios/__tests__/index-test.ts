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
jest.mock('../../../log');
jest.mock('../../resolveMode.js', () => ({ resolveMode: jest.fn(() => 'development') }), {
  virtual: true,
});

const { assertArgs } = require('../../../utils/args') as { assertArgs: jest.Mock };
const { loadEnvFiles } = require('../../../utils/nodeEnv.js') as { loadEnvFiles: jest.Mock };
const { logCmdError } = require('../../../utils/errors') as { logCmdError: jest.Mock };
const { resolveMode } = require('../../resolveMode.js') as { resolveMode: jest.Mock };

it('loads env files in the resolved mode', async () => {
  assertArgs.mockReturnValue({ '--prod': true });
  resolveMode.mockReturnValueOnce('development');

  await expoCompileIos([]);

  expect(resolveMode).toHaveBeenCalledWith({ dev: undefined, prod: true });
  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
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
