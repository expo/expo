import { expoCompileIos } from '../index';

jest.mock('../../../log');
jest.mock('../../../utils/args', () => ({
  ...jest.requireActual('../../../utils/args'),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock('../../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), {
  virtual: true,
});
jest.mock('../../../utils/errors', () => ({
  ...jest.requireActual('../../../utils/errors'),
  logCmdError: jest.fn(),
}));
jest.mock('../../resolveMode.js', () => jest.requireActual('../../resolveMode'), {
  virtual: true,
});
jest.mock('../../resolveOptions.js', () => jest.requireActual('../../resolveOptions'), {
  virtual: true,
});
jest.mock('../compileIosAsync.js', () => ({ compileIosAsync: jest.fn(async () => {}) }), {
  virtual: true,
});

const { getProjectRoot } = require('../../../utils/args') as { getProjectRoot: jest.Mock };
const { loadEnvFiles } = require('../../../utils/nodeEnv.js') as { loadEnvFiles: jest.Mock };
const { logCmdError } = require('../../../utils/errors') as { logCmdError: jest.Mock };
const { compileIosAsync } = require('../compileIosAsync.js') as { compileIosAsync: jest.Mock };

it('loads env files in the resolved mode before compiling', async () => {
  await expoCompileIos(['--dev']);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    compileIosAsync.mock.invocationCallOrder[0]!
  );
});

it('compiles the project directory with the resolved options', async () => {
  await expoCompileIos(['./app', '--dev', '--output-dir', 'build', '--output-type=app']);

  expect(getProjectRoot).toHaveBeenCalledWith(expect.objectContaining({ _: ['./app'] }));
  expect(compileIosAsync).toHaveBeenCalledWith('/app', {
    mode: 'development',
    device: undefined,
    outputDir: '/app/build',
    outputType: 'app',
  });
});

it('handles env file errors', async () => {
  const error = new Error('env error');
  loadEnvFiles.mockImplementationOnce(() => {
    throw error;
  });

  await expoCompileIos(['--dev']);

  expect(logCmdError).toHaveBeenCalledWith(error);
});
