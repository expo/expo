import spawnAsync from '@expo/spawn-async';

import { AbortCommandError } from '../../../../utils/errors';
import { formatGradleInstallArguments, installAsync, spawnGradleAsync } from '../gradle';

const platform = process.platform;

const mockPlatform = (value: string) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

afterEach(() => {
  mockPlatform(platform);
});

describe(formatGradleInstallArguments, () => {
  it(`formats`, () => {
    expect(
      formatGradleInstallArguments({
        variant: 'debug',
        appName: 'app',
      })
    ).toEqual(['app:installDebug']);
  });
  it('formats a root application task', () => {
    expect(
      formatGradleInstallArguments({
        variant: 'debug',
        appName: '',
      })
    ).toEqual(['installDebug']);
  });
});

describe(installAsync, () => {
  it(`installs`, async () => {
    await installAsync('/android', {
      variant: 'something',
      appName: 'foobar',
      port: 8081,
      deviceId: 'serial-2',
    });

    expect(spawnAsync).toHaveBeenCalledWith(
      '/android/gradlew',
      ['foobar:installSomething', '-PreactNativeDevServerPort=8081'],
      {
        cwd: '/android',
        stdio: 'inherit',
        env: expect.objectContaining({ ANDROID_SERIAL: 'serial-2' }),
      }
    );
  });

  it('keeps the selected device and build settings when installing split APKs', async () => {
    const previousSerial = process.env.ANDROID_SERIAL;
    process.env.ANDROID_SERIAL = 'unrelated-device';
    try {
      await installAsync('/android', {
        variant: 'demoRelease',
        appName: 'app',
        port: 8082,
        deviceId: 'serial-2',
        architectures: 'arm64-v8a',
        eagerBundleOptions: '{"bundle":"/tmp/main.jsbundle"}',
      });

      expect(spawnAsync).toHaveBeenCalledWith(
        '/android/gradlew',
        [
          'app:installDemoRelease',
          '-PreactNativeArchitectures=arm64-v8a',
          '-PreactNativeDevServerPort=8082',
        ],
        {
          cwd: '/android',
          stdio: 'inherit',
          env: expect.objectContaining({
            ANDROID_SERIAL: 'serial-2',
            __EXPO_EAGER_BUNDLE_OPTIONS: '{"bundle":"/tmp/main.jsbundle"}',
          }),
        }
      );
      expect(process.env.ANDROID_SERIAL).toBe('unrelated-device');
    } finally {
      if (previousSerial === undefined) delete process.env.ANDROID_SERIAL;
      else process.env.ANDROID_SERIAL = previousSerial;
    }
  });
});

describe(spawnGradleAsync, () => {
  it(`spawns a process`, async () => {
    mockPlatform('darwin');

    await spawnGradleAsync('/', {
      args: ['foo', 'bar'],
    });

    expect(spawnAsync).toHaveBeenCalledWith('/gradlew', ['foo', 'bar'], {
      cwd: '/',
      stdio: 'inherit',
      env: expect.anything(),
    });
  });
  it(`passes a custom port to the spawned process`, async () => {
    mockPlatform('darwin');

    await spawnGradleAsync('/', {
      args: ['foo', 'bar'],
      port: 3000,
    });

    expect(spawnAsync).toHaveBeenCalledWith(
      '/gradlew',
      ['foo', 'bar', '-PreactNativeDevServerPort=3000'],
      { cwd: '/', stdio: 'inherit', env: expect.anything() }
    );
  });

  it.each([{ status: 130 }, { status: null, signal: 'SIGINT' }])(
    'throws a controlled abort error for ctrl+c: %j',
    async (error) => {
      mockPlatform('darwin');
      jest.mocked(spawnAsync).mockRejectedValueOnce(error);

      await expect(
        spawnGradleAsync('/', {
          args: ['foo', 'bar'],
          port: 3000,
        })
      ).rejects.toThrow(AbortCommandError);
    }
  );

  it('preserves native installation failures', async () => {
    const error = new Error('Install failed');
    jest.mocked(spawnAsync).mockRejectedValueOnce(error);

    await expect(spawnGradleAsync('/', { args: ['app:installDebug'] })).rejects.toBe(error);
  });
});
