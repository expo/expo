import { CompileError } from '@ramonclaudio/compile';

import { logCmdError } from '../../utils/errors';
import { promptAsync } from '../../utils/prompts';
import { compileAsync } from '../compileAsync';
import { expoCompile, expoCompileAndroid, expoCompileIos } from '../index';

jest.mock('../../utils/errors', () => ({
  ...jest.requireActual('../../utils/errors'),
  logCmdError: jest.fn(),
}));
jest.mock('../../utils/prompts');
jest.mock('../compileAsync');
jest.mock('../compileAsync.js', () => jest.requireMock('../compileAsync'), { virtual: true });
jest.mock('../../utils/prompts.js', () => jest.requireMock('../../utils/prompts'), {
  virtual: true,
});

const originalExitCode = process.exitCode;

beforeEach(() => {
  jest.clearAllMocks();
  process.exitCode = undefined;
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  process.exitCode = originalExitCode;
});

it.each([expoCompile, expoCompileIos, expoCompileAndroid])(
  'shows help without compiling a project',
  async (command) => {
    await command(['--help']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Compile a native app'));
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Requires a native project with its dependencies installed.')
    );
    expect(compileAsync).not.toHaveBeenCalled();
    expect(promptAsync).not.toHaveBeenCalled();
  }
);

it('prints only the returned paths', async () => {
  jest.mocked(compileAsync).mockResolvedValue(['/app/arm64.apk', '/app/x86.apk']);
  await expoCompileAndroid(['/app', '--dev']);
  expect(compileAsync).toHaveBeenCalledWith({
    platform: 'android',
    cwd: '/app',
    mode: 'development',
    outputDir: undefined,
    outputType: 'apk',
  });
  expect(jest.mocked(console.log).mock.calls).toEqual([['/app/arm64.apk'], ['/app/x86.apk']]);
  expect(promptAsync).not.toHaveBeenCalled();
});

it('prompts for a missing platform on stderr', async () => {
  jest.mocked(promptAsync).mockResolvedValue({ platform: 'ios' });
  jest.mocked(compileAsync).mockResolvedValue(['/app/example.app']);
  await expoCompile(['--dev']);
  expect(promptAsync).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'platform', stdout: process.stderr }),
    expect.any(Object)
  );
  expect(compileAsync).toHaveBeenCalledWith(
    expect.objectContaining({ platform: 'ios', mode: 'development' })
  );
});

it('validates arguments before compilation', async () => {
  await expoCompileIos(['--dev', '--output-type', 'apk']);
  expect(logCmdError).toHaveBeenCalledWith(expect.objectContaining({ code: 'BAD_ARGS' }));
  expect(compileAsync).not.toHaveBeenCalled();
});

it.each([
  [new CompileError('native failure', { exitCode: 7 }), 7],
  [new CompileError('cancelled', { signal: 'SIGINT' }), 130],
  [new CompileError('terminated', { signal: 'SIGTERM' }), 143],
] as const)('preserves the native error status', async (error, exitCode) => {
  jest.mocked(compileAsync).mockRejectedValue(error);
  await expoCompileAndroid(['--dev']);
  expect(process.exitCode).toBe(exitCode);
  expect(console.error).toHaveBeenCalledWith(error.message);
  expect(console.log).not.toHaveBeenCalled();
  expect(logCmdError).not.toHaveBeenCalled();
});
