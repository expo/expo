import { loadProjectEnv } from '@expo/env';
import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { AbortCommandError } from '../../../utils/errors';
import { resolveBuildModeAsync } from '../resolveBuildModeAsync';

const prefix = 'EXPO_ANDROID_BUILD_MODE=';

function gradleResult(value: unknown) {
  return {
    pid: 1,
    status: 0,
    signal: null,
    output: ['', ''],
    stdout: `Gradle configuration output\n${prefix}${JSON.stringify(value)}\n`,
    stderr: '',
  };
}

function mockReport(value: unknown) {
  jest.mocked(spawnAsync).mockResolvedValue(gradleResult(value));
}

function mockNativeDebugReport() {
  const { ChildProcess } = jest.requireActual<typeof import('child_process')>('child_process');
  jest.mocked(spawnAsync).mockImplementation((_command, _args, options) =>
    Object.assign(
      Promise.resolve(
        gradleResult({
          version: 1,
          projectPath: ':app',
          variant: 'debug',
          mode: options?.env?.EX_UPDATES_NATIVE_DEBUG === '1' ? 'production' : 'development',
        })
      ),
      { child: new ChildProcess() }
    )
  );
}

describe(resolveBuildModeAsync, () => {
  const originalEnv = process.env;
  const originalPlatform = process.platform;

  beforeEach(() => {
    process.env = { NODE_ENV: 'test', SHELL_VALUE: 'keep' };
    jest.mocked(spawnAsync).mockReset();
  });

  afterEach(() => {
    vol.reset();
    process.env = originalEnv;
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it.each(['development', 'production'] as const)('accepts the reported %s mode', async (mode) => {
    mockReport({
      version: 1,
      projectPath: ':app',
      variant: 'demoDebug',
      mode,
    });
    process.env = {
      ...process.env,
      EXPO_PUBLIC_OLD: 'stale',
      SHELL_VALUE: 'keep',
      __EXPO_ENV_LOADED: JSON.stringify(['EXPO_PUBLIC_OLD']),
      __EXPO_CONFIG_MODE: 'production',
    };

    expect(await resolveBuildModeAsync('/project', 'DEMODEBUG')).toEqual({
      variant: 'demoDebug',
      mode,
    });
    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledWith(
      '/project/android/gradlew',
      expect.arrayContaining([
        ':app:expoResolveBuildMode',
        '--init-script',
        '-Pexpo.android.variant=DEMODEBUG',
      ]),
      expect.objectContaining({
        cwd: '/project/android',
        env: expect.objectContaining({
          SHELL_VALUE: 'keep',
          __EXPO_CONFIG_MODE: 'production',
        }),
      })
    );
    for (const [, , options] of jest.mocked(spawnAsync).mock.calls) {
      expect(options!.env).not.toHaveProperty('EXPO_PUBLIC_OLD');
      expect(options!.env!.__EXPO_ENV_LOADED).toBe('[]');
    }
    expect(process.env.EXPO_PUBLIC_OLD).toBe('stale');
  });

  it.each([
    { variant: 'debug', mode: 'development' },
    { variant: 'debugOptimized', mode: 'development' },
    { variant: 'release', mode: 'production' },
  ])('queries $variant once with its $mode environment', async ({ variant, mode }) => {
    vol.fromJSON(
      {
        '.env.development': 'EXPO_PUBLIC_MODE=development',
        '.env.production': 'EXPO_PUBLIC_MODE=production',
      },
      '/project'
    );
    mockReport({ version: 1, projectPath: ':app', variant, mode });

    expect(await resolveBuildModeAsync('/project', variant)).toEqual({
      variant,
      mode,
    });

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(spawnAsync).mock.calls[0]![2]!.env).toMatchObject({
      NODE_ENV: mode,
      BABEL_ENV: mode,
      EXPO_PUBLIC_MODE: mode,
    });
  });

  it.each([
    { shellBabelEnv: undefined, queryBabelEnv: 'development' },
    { shellBabelEnv: 'custom', queryBabelEnv: 'custom' },
  ])(
    'uses the reported mode after one query with BABEL_ENV=$shellBabelEnv',
    async ({ shellBabelEnv, queryBabelEnv }) => {
      if (shellBabelEnv !== undefined) {
        process.env.BABEL_ENV = shellBabelEnv;
      }
      vol.fromJSON(
        {
          '.env.development': 'EXPO_PUBLIC_MODE=development\nONLY_DEVELOPMENT=true',
          '.env.production': 'EXPO_PUBLIC_MODE=production',
        },
        '/project'
      );
      mockReport({
        version: 1,
        projectPath: ':app',
        variant: 'qa',
        mode: 'production',
      });
      const parentEnv = process.env;
      const parentValues = { ...parentEnv };

      expect(await resolveBuildModeAsync('/project', 'qa')).toEqual({
        variant: 'qa',
        mode: 'production',
      });

      expect(spawnAsync).toHaveBeenCalledTimes(1);
      const [first] = jest.mocked(spawnAsync).mock.calls;
      expect(first![2]!.env).toMatchObject({
        NODE_ENV: 'development',
        BABEL_ENV: queryBabelEnv,
        EXPO_PUBLIC_MODE: 'development',
        ONLY_DEVELOPMENT: 'true',
      });
      expect(process.env).toBe(parentEnv);
      expect(process.env).toEqual(parentValues);
    }
  );

  it.each(['shell', 'common dotenv'])('resolves native debugging from %s', async (source) => {
    if (source === 'shell') {
      process.env.EX_UPDATES_NATIVE_DEBUG = '1';
    } else {
      vol.fromJSON({ '.env': 'EX_UPDATES_NATIVE_DEBUG=1' }, '/project');
    }
    mockNativeDebugReport();
    const parentValues = { ...process.env };

    expect(await resolveBuildModeAsync('/project', 'debug')).toEqual({
      variant: 'debug',
      mode: 'production',
    });

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(spawnAsync).mock.calls[0]![2]!.env).toMatchObject({
      NODE_ENV: 'development',
      EX_UPDATES_NATIVE_DEBUG: '1',
    });
    expect(process.env).toEqual(parentValues);
  });

  it('preserves shell values over dotenv when querying Gradle', async () => {
    process.env.EX_UPDATES_NATIVE_DEBUG = '0';
    vol.fromJSON({ '.env': 'EX_UPDATES_NATIVE_DEBUG=1\nSHELL_VALUE=replace' }, '/project');
    mockNativeDebugReport();

    expect(await resolveBuildModeAsync('/project', 'debug')).toEqual({
      variant: 'debug',
      mode: 'development',
    });

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(spawnAsync).mock.calls[0]![2]!.env).toMatchObject({
      EX_UPDATES_NATIVE_DEBUG: '0',
      SHELL_VALUE: 'keep',
    });
  });

  it('does not load dotenv into the query when EXPO_NO_DOTENV is set', async () => {
    process.env.EXPO_NO_DOTENV = '1';
    vol.fromJSON({ '.env': 'EX_UPDATES_NATIVE_DEBUG=1' }, '/project');
    mockNativeDebugReport();

    expect(await resolveBuildModeAsync('/project', 'debug')).toEqual({
      variant: 'debug',
      mode: 'development',
    });

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(spawnAsync).mock.calls[0]![2]!.env).not.toHaveProperty(
      'EX_UPDATES_NATIVE_DEBUG'
    );
  });

  it('removes values loaded from another project without changing the parent environment', async () => {
    vol.fromJSON({ '.env': 'EX_UPDATES_NATIVE_DEBUG=1\nEXPO_PUBLIC_OLD=stale' }, '/other');
    loadProjectEnv('/other', { mode: 'development', silent: true });
    const parentEnv = process.env;
    const parentValues = { ...parentEnv };
    mockNativeDebugReport();

    expect(await resolveBuildModeAsync('/project', 'debug')).toEqual({
      variant: 'debug',
      mode: 'development',
    });

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    const childEnv = jest.mocked(spawnAsync).mock.calls[0]![2]!.env;
    expect(childEnv).not.toHaveProperty('EX_UPDATES_NATIVE_DEBUG');
    expect(childEnv).not.toHaveProperty('EXPO_PUBLIC_OLD');
    expect(process.env).toBe(parentEnv);
    expect(process.env).toEqual(parentValues);
  });

  it.each([
    { version: 2, projectPath: ':app', variant: 'debug', mode: 'development' },
    {
      version: 1,
      projectPath: ':other',
      variant: 'debug',
      mode: 'development',
    },
    { version: 1, projectPath: ':app', variant: 'release', mode: 'production' },
    { version: 1, projectPath: ':app', variant: 'debug', mode: 'staging' },
    null,
  ])('rejects a mismatched report %j', async (report) => {
    mockReport(report);
    await expect(resolveBuildModeAsync('/project', 'debug')).rejects.toThrow(
      'Gradle returned an invalid build mode report'
    );
  });

  it('uses the Windows Gradle wrapper', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    mockReport({
      version: 1,
      projectPath: ':app',
      variant: 'debug',
      mode: 'development',
    });

    await resolveBuildModeAsync('/project', 'debug');

    expect(spawnAsync).toHaveBeenCalledWith(
      '/project/android/gradlew.bat',
      expect.any(Array),
      expect.any(Object)
    );
  });

  it.each([
    '',
    prefix + '{invalid',
    gradleResult({
      version: 1,
      projectPath: ':app',
      variant: 'debug',
      mode: 'development',
    }).stdout.repeat(2),
  ])('rejects missing, malformed, or multiple reports', async (stdout) => {
    mockReport(null);
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      pid: 1,
      status: 0,
      signal: null,
      output: ['', ''],
      stdout,
      stderr: '',
    });
    await expect(resolveBuildModeAsync('/project', 'debug')).rejects.toThrow(/Gradle/);
  });

  it('rejects an empty variant before spawning Gradle', async () => {
    await expect(resolveBuildModeAsync('/project', '')).rejects.toThrow('--variant');
    expect(spawnAsync).not.toHaveBeenCalled();
  });

  it('preserves a Gradle failure', async () => {
    const error = new Error('Unknown or disabled Android variant');
    jest.mocked(spawnAsync).mockRejectedValueOnce(error);
    await expect(resolveBuildModeAsync('/project', 'missing')).rejects.toBe(error);
    expect(spawnAsync).toHaveBeenCalledTimes(1);
  });

  it('handles cancellation', async () => {
    jest.mocked(spawnAsync).mockRejectedValueOnce({ status: 130 });
    await expect(resolveBuildModeAsync('/project', 'debug')).rejects.toBeInstanceOf(
      AbortCommandError
    );
  });
});
