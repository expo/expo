import spawnAsync from '@expo/spawn-async';

import { AbortCommandError } from '../../../../utils/errors';
import { assembleAsync, formatGradleArguments, installAsync, spawnGradleAsync } from '../gradle';

jest.mock('../../../../utils/env', () => ({
  env: {
    EXPO_PROFILE: false,
  },
}));

const platform = process.platform;

const mockPlatform = (value: string) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

afterEach(() => {
  mockPlatform(platform);
});

describe(formatGradleArguments, () => {
  it(`formats`, () => {
    expect(
      formatGradleArguments('assemble', {
        variant: 'debug',
        appName: 'app',
      })
    ).toEqual(['app:assembleDebug']);
  });
  it(`formats with explicit tasks`, () => {
    expect(
      formatGradleArguments('assemble', {
        tasks: ['foo', 'bar'],
        variant: 'debug',
        appName: 'app',
      })
    ).toEqual(['app:foo', 'app:bar']);
  });
});

describe(assembleAsync, () => {
  it(`builds`, async () => {
    await assembleAsync('/android', {
      variant: 'something',
      buildCache: true,
      appName: 'foobar',
      port: 8081,
    });

    expect(spawnAsync).toHaveBeenCalledWith(
      '/android/gradlew',
      [
        'foobar:assembleSomething',
        '-x',
        'lint',
        '-x',
        'test',
        '--configure-on-demand',
        '--build-cache',
        '-PreactNativeDevServerPort=8081',
      ],
      { cwd: '/android', stdio: 'inherit' }
    );
  });
  it(`builds with minimum props`, async () => {
    await assembleAsync('/android', {
      variant: 'debug',
      appName: 'app',
    });

    expect(spawnAsync).toHaveBeenCalledWith(
      '/android/gradlew',
      ['app:assembleDebug', '-x', 'lint', '-x', 'test', '--configure-on-demand'],
      { cwd: '/android', stdio: 'inherit' }
    );
  });
});

describe(installAsync, () => {
  it(`installs`, async () => {
    await installAsync('/android', { variant: 'something', appName: 'foobar', port: 8081 });

    expect(spawnAsync).toHaveBeenCalledWith(
      '/android/gradlew',
      ['foobar:installSomething', '-PreactNativeDevServerPort=8081'],
      { cwd: '/android', stdio: 'inherit' }
    );
  });
});

describe(spawnGradleAsync, () => {
  it(`spawns a process`, async () => {
    mockPlatform('darwin');

    await spawnGradleAsync('/', {
      args: ['foo', 'bar'],
    });

    expect(spawnAsync).toBeCalledWith('/gradlew', ['foo', 'bar'], { cwd: '/', stdio: 'inherit' });
  });
  it(`passes a custom port to the spawned process`, async () => {
    mockPlatform('darwin');

    await spawnGradleAsync('/', {
      args: ['foo', 'bar'],
      port: 3000,
    });

    expect(spawnAsync).toBeCalledWith(
      '/gradlew',
      ['foo', 'bar', '-PreactNativeDevServerPort=3000'],
      { cwd: '/', stdio: 'inherit' }
    );
  });

  it(`throws a controlled abort error for ctrl+c`, async () => {
    mockPlatform('darwin');
    jest.mocked(spawnAsync).mockRejectedValueOnce({ status: 130 });

    await expect(
      spawnGradleAsync('/', {
        args: ['foo', 'bar'],
        port: 3000,
      })
    ).rejects.toThrowError(AbortCommandError);
  });
});
