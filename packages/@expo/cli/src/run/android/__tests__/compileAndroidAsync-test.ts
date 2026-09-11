import spawnAsync from '@expo/spawn-async';
import type { ProcessRunner } from '@ramonclaudio/compile';
import { buildAndroid, CompileError } from '@ramonclaudio/compile';
import path from 'path';

import { env } from '../../../utils/env';
import { AbortCommandError, CommandError } from '../../../utils/errors';
import { compileAndroidAsync } from '../compileAndroidAsync';

jest.mock('@ramonclaudio/compile', () => ({
  ...jest.requireActual('@ramonclaudio/compile'),
  buildAndroid: jest.fn(),
}));
jest.mock('../../../utils/env', () => ({ env: { EXPO_PROFILE: false } }));

const platform = process.platform;

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: platform });
  jest.restoreAllMocks();
});

it('builds the selected module and variant and returns its artifact paths', async () => {
  const artifacts = ['/custom/build/my-app.apk'];
  jest.mocked(buildAndroid).mockResolvedValueOnce(artifacts);
  jest.replaceProperty(env, 'EXPO_PROFILE', true);

  await expect(
    compileAndroidAsync('/android', {
      appName: 'nested:application',
      variant: 'demoRelease',
      port: 8082,
      buildCache: true,
      architectures: 'arm64-v8a,x86_64',
      eagerBundleOptions: '{"outputDir":"/bundle"}',
    })
  ).resolves.toBe(artifacts);

  expect(buildAndroid).toHaveBeenCalledWith(
    {
      wrapper: { cwd: '/android', path: '/android/gradlew' },
      modulePath: ':nested:application',
      variant: 'demoRelease',
      outputType: 'apk',
      gradleArgs: [
        '-x',
        'lint',
        '-x',
        'test',
        '--configure-on-demand',
        '--build-cache',
        '--profile',
        '-PreactNativeDevServerPort=8082',
        '-PreactNativeArchitectures=arm64-v8a,x86_64',
      ],
    },
    {
      runProcess: expect.any(Function),
      env: { ...process.env, __EXPO_EAGER_BUNDLE_OPTIONS: '{"outputDir":"/bundle"}' },
    }
  );
});

it('keeps optional Gradle settings unset', async () => {
  await compileAndroidAsync('/android', { appName: 'app', variant: 'debug' });
  expect(buildAndroid).toHaveBeenCalledWith(
    {
      wrapper: { cwd: '/android', path: '/android/gradlew' },
      modulePath: ':app',
      variant: 'debug',
      outputType: 'apk',
      gradleArgs: ['-x', 'lint', '-x', 'test', '--configure-on-demand'],
    },
    { runProcess: expect.any(Function), env: process.env }
  );
});

it.each(['Debug', 'DEBUG', 'previewDebugOptimized', 'customProduction'])(
  'forwards the requested variant %s unchanged',
  async (variant) => {
    await compileAndroidAsync('/android', { appName: 'app', variant });
    expect(buildAndroid).toHaveBeenCalledWith(
      expect.objectContaining({ variant }),
      expect.anything()
    );
  }
);

it.each([
  ['', ':'],
  [':application', ':application'],
])('maps the module %s to %s', async (appName, modulePath) => {
  await compileAndroidAsync('/android', { appName, variant: 'debug' });
  expect(buildAndroid).toHaveBeenCalledWith(
    expect.objectContaining({ modulePath }),
    expect.anything()
  );
});

it('passes the Windows Gradle wrapper to Compile', async () => {
  Object.defineProperty(process, 'platform', { value: 'win32' });
  await compileAndroidAsync('/android', { appName: 'app', variant: 'debug' });
  expect(buildAndroid).toHaveBeenCalledWith(
    expect.objectContaining({
      wrapper: { cwd: '/android', path: path.join('/android', 'gradlew.bat') },
    }),
    { runProcess: expect.any(Function), env: process.env }
  );
});

it.each([
  new CompileError('Cancelled', { signal: 'SIGINT' }),
  new CompileError('Cancelled', { exitCode: 130 }),
])('treats %s as cancellation', async (error) => {
  jest.mocked(buildAndroid).mockRejectedValueOnce(error);
  await expect(
    compileAndroidAsync('/android', { appName: 'app', variant: 'debug' })
  ).rejects.toThrow(AbortCommandError);
});

it('reports Compile failures without losing the native diagnostic', async () => {
  jest
    .mocked(buildAndroid)
    .mockRejectedValueOnce(
      new CompileError('Gradle failed with exit code 1: native diagnostic', { exitCode: 1 })
    );
  await expect(
    compileAndroidAsync('/android', { appName: 'app', variant: 'debug' })
  ).rejects.toEqual(
    new CommandError('ANDROID_BUILD_FAILED', 'Gradle failed with exit code 1: native diagnostic')
  );
});

it('preserves errors that do not originate in Compile', async () => {
  const error = new Error('Environment failure');
  jest.mocked(buildAndroid).mockRejectedValueOnce(error);
  await expect(compileAndroidAsync('/android', { appName: 'app', variant: 'debug' })).rejects.toBe(
    error
  );
});

async function getCompileRunnerAsync(): Promise<ProcessRunner> {
  await compileAndroidAsync('/android', { appName: 'app', variant: 'debug' });
  const runner = jest.mocked(buildAndroid).mock.calls.at(-1)?.[1]?.runProcess;
  if (!runner) throw new Error('Compile was not given a process runner.');
  return runner;
}

it('passes the Gradle command, arguments, and env vars to spawnAsync', async () => {
  const runner = await getCompileRunnerAsync();
  const command = 'C:\\app & tools\\android\\gradlew.bat';
  const args = [
    ':app:assembleDebug',
    'compileAndroidApk',
    '--init-script',
    'C:\\tools & libs\\android.gradle',
  ];
  const signal = new AbortController().signal;
  const nativeEnv = {
    ...process.env,
    COMPILE_ANDROID_REPORT: 'C:\\temp & builds\\artifacts.json',
    COMPILE_ANDROID_MODULE: ':app',
    COMPILE_ANDROID_VARIANT: 'debug',
  };
  jest.mocked(spawnAsync).mockResolvedValueOnce({
    pid: 123,
    status: 0,
    signal: null,
    stdout: '',
    stderr: '',
    output: ['', ''],
  });

  await expect(
    runner(command, args, {
      cwd: 'C:\\app & tools\\android',
      env: nativeEnv,
      signal,
      outputMode: 'stderr',
    })
  ).resolves.toEqual({ status: 'exited', exitCode: 0, stdout: '', stderr: '' });
  expect(spawnAsync).toHaveBeenCalledWith(command, args, {
    cwd: 'C:\\app & tools\\android',
    env: nativeEnv,
    signal,
    stdio: 'inherit',
  });
});

it.each(['capture', 'quiet'] as const)('captures native output for %s', async (outputMode) => {
  const runner = await getCompileRunnerAsync();
  jest.mocked(spawnAsync).mockResolvedValueOnce({
    pid: 123,
    status: 0,
    signal: null,
    stdout: 'native stdout',
    stderr: 'native stderr',
    output: ['native stdout', 'native stderr'],
  });
  await expect(
    runner('/android/gradlew', ['task'], {
      cwd: '/android',
      env: undefined,
      signal: undefined,
      outputMode,
    })
  ).resolves.toEqual({
    status: 'exited',
    exitCode: 0,
    stdout: 'native stdout',
    stderr: 'native stderr',
  });
  expect(spawnAsync).toHaveBeenCalledWith('/android/gradlew', ['task'], {
    cwd: '/android',
    env: undefined,
    signal: undefined,
    stdio: 'pipe',
  });
});

it.each([
  { status: 130, signal: null },
  { status: null, signal: 'SIGINT' },
])('keeps a native process cancellation silent: %j', async (error) => {
  const runner = await getCompileRunnerAsync();
  jest.mocked(spawnAsync).mockRejectedValueOnce(Object.assign(new Error('Cancelled'), error));
  await expect(
    runner('/android/gradlew', [], {
      cwd: '/android',
      env: undefined,
      signal: undefined,
      outputMode: 'stderr',
    })
  ).rejects.toThrow(AbortCommandError);
});

it.each([
  Object.assign(new Error('Native diagnostic'), { status: 23, signal: null }),
  Object.assign(new Error('Wrapper missing'), { code: 'ENOENT', status: null, signal: null }),
])('rethrows Gradle process errors: %s', async (error) => {
  const runner = await getCompileRunnerAsync();
  jest.mocked(spawnAsync).mockRejectedValueOnce(error);
  await expect(
    runner('/android/gradlew', [], {
      cwd: '/android',
      env: undefined,
      signal: undefined,
      outputMode: 'stderr',
    })
  ).rejects.toBe(error);
});
