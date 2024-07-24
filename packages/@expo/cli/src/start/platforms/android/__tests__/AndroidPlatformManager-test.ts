import * as Log from '../../../../log';
import { AndroidDeviceManager } from '../AndroidDeviceManager';
import { AndroidPlatformManager } from '../AndroidPlatformManager';
import { startAdbReverseAsync } from '../adbReverse';

jest.mock(`../../../../log`);
jest.mock('../adb');
jest.mock('../../ExpoGoInstaller');
jest.mock('../adbReverse', () => ({
  startAdbReverseAsync: jest.fn(),
}));

const originalResolveDevice = AndroidDeviceManager.resolveAsync;

afterAll(() => {
  AndroidDeviceManager.resolveAsync = originalResolveDevice;
});

describe('openAsync', () => {
  beforeEach(() => {
    AndroidDeviceManager.resolveAsync = jest.fn(async () => {
      const manager = new AndroidDeviceManager({ udid: '123', name: 'Pixel 5' } as any);
      manager.isAppInstalledAndIfSoReturnContainerPathForIOSAsync = jest.fn(() =>
        Promise.resolve(true)
      );
      return manager;
    });
  });

  it(`opens a project in a custom development client using intent string`, async () => {
    const manager = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => null,
    });

    // @ts-expect-error
    manager._getAppIdResolver = jest.fn(() => ({
      getAppIdAsync: () => 'dev.bacon.app',
    }));

    expect(await manager.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'dev.bacon.app/.MainActivity',
    });
    expect(startAdbReverseAsync).toHaveBeenCalledTimes(1);
    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*Pixel 5/));
  });

  it(`allows overriding the intent string`, async () => {
    const manager = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => null,
    });
    // @ts-expect-error
    manager._getAppIdResolver = jest.fn(() => ({
      getAppIdAsync: () => 'dev.bacon.app',
    }));
    expect(
      await manager.openAsync({ runtime: 'custom', props: { launchActivity: 'foobar' } })
    ).toStrictEqual({
      url: 'foobar',
    });
  });
});
