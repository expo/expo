import * as Log from '../../../../log';
import { AndroidDeviceManager } from '../AndroidDeviceManager';
import { AndroidPlatformManager } from '../AndroidPlatformManager';
import { startAdbReverseAsync } from '../adb';

jest.mock('fs');
jest.mock(`../../../../log`);
jest.mock('../adb');
jest.mock('../../ExpoGoInstaller');

const asMock = (fn: any): jest.Mock => fn;
const originalResolveDevice = AndroidDeviceManager.resolveAsync;

afterAll(() => {
  AndroidDeviceManager.resolveAsync = originalResolveDevice;
});

describe('openAsync', () => {
  beforeEach(() => {
    asMock(Log.log).mockReset();
    asMock(Log.warn).mockReset();
    asMock(Log.error).mockReset();
    AndroidDeviceManager.resolveAsync = jest.fn(async () => {
      const manager = new AndroidDeviceManager({ udid: '123', name: 'Pixel 5' } as any);
      manager.isAppInstalledAsync = jest.fn(() => Promise.resolve(true));
      return manager;
    });
  });

  it(`opens a project in a custom development client using intent string`, async () => {
    asMock(startAdbReverseAsync).mockClear();
    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => null,
    });

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
    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => null,
    });
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
