import * as Log from '../../../../log';
import { hasDirectDevClientDependency } from '../../../detectDevClient';
import { AndroidAppIdResolver } from '../AndroidAppIdResolver';
import { AndroidDeviceManager } from '../AndroidDeviceManager';
import { AndroidPlatformManager } from '../AndroidPlatformManager';
import { startAdbReverseAsync } from '../adbReverse';

jest.mock(`../../../../log`);
jest.mock('../../../detectDevClient');
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
    const platform = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => '',
      getRedirectUrl: () => null,
    });

    jest.spyOn(platform, '_getAppIdResolver').mockReturnValue({
      getAppIdAsync: async () => 'dev.bacon.app',
    } as AndroidAppIdResolver);

    expect(await platform.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'dev.bacon.app/.MainActivity',
    });
    expect(startAdbReverseAsync).toHaveBeenCalledTimes(1);
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*Pixel 5/));
  });

  it(`allows overriding the intent string`, async () => {
    const platform = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => '',
      getRedirectUrl: () => null,
    });

    jest.spyOn(platform, '_getAppIdResolver').mockReturnValue({
      getAppIdAsync: async () => 'dev.bacon.app',
    } as AndroidAppIdResolver);

    expect(
      await platform.openAsync({ runtime: 'custom', props: { launchActivity: 'foobar' } })
    ).toStrictEqual({
      url: 'foobar',
    });
  });

  it('allows overriding the app id', async () => {
    const device = new AndroidDeviceManager({ udid: '123', name: 'Pixel 5' } as any);
    const platform = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => '',
      getRedirectUrl: () => null,
    });

    jest.spyOn(AndroidDeviceManager, 'resolveAsync').mockResolvedValue(device);
    jest
      .spyOn(device, 'isAppInstalledAndIfSoReturnContainerPathForIOSAsync')
      .mockResolvedValue(true);
    jest.spyOn(platform, '_getAppIdResolver').mockReturnValue({
      getAppIdAsync: async () => 'dev.bacon.app',
    } as AndroidAppIdResolver);

    expect(
      await platform.openAsync({
        runtime: 'custom',
        props: {
          launchActivity: 'dev.bacon.app.free/dev.bacon.app.MainActivity',
          customAppId: 'dev.bacon.app.free',
        },
      })
    ).toStrictEqual({
      url: 'dev.bacon.app.free/dev.bacon.app.MainActivity',
    });

    expect(device.isAppInstalledAndIfSoReturnContainerPathForIOSAsync).toHaveBeenCalledWith(
      'dev.bacon.app.free'
    );
  });

  it('opens devclient with custom runtime, app id, launch activity', async () => {
    const device = new AndroidDeviceManager({ udid: '123', name: 'Pixel 5' } as any);
    const platform = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => 'exp://dev-client-url',
      getDevServerUrl: () => null,
      getExpoGoUrl: () => '',
      getRedirectUrl: () => null,
    });

    jest.spyOn(AndroidDeviceManager, 'resolveAsync').mockResolvedValue(device);
    jest
      .spyOn(device, 'isAppInstalledAndIfSoReturnContainerPathForIOSAsync')
      .mockResolvedValue(true);
    jest.spyOn(platform, '_getAppIdResolver').mockReturnValue({
      getAppIdAsync: async () => 'dev.bacon.app',
    } as AndroidAppIdResolver);

    jest.mocked(hasDirectDevClientDependency).mockReturnValue(true);

    expect(
      await platform.openAsync({
        runtime: 'custom',
        props: {
          launchActivity: 'dev.bacon.app.free/dev.bacon.app.MainActivity',
          customAppId: 'dev.bacon.app.free',
        },
      })
    ).toStrictEqual({
      url: 'exp://dev-client-url',
    });
    expect(hasDirectDevClientDependency).toHaveBeenCalledWith('/');
  });

  it('re-opens with custom runtime props if set', async () => {
    const platform = new AndroidPlatformManager('/', 8081, {
      getCustomRuntimeUrl: () => null,
      getDevServerUrl: () => null,
      getExpoGoUrl: () => '',
      getRedirectUrl: () => null,
    });

    jest.spyOn(platform, '_getAppIdResolver').mockReturnValue({
      getAppIdAsync: async () => 'dev.bacon.app',
    } as AndroidAppIdResolver);

    // Open once with custom launch properties
    expect(
      await platform.openAsync({
        runtime: 'custom',
        props: {
          launchActivity: 'dev.bacon.app.free/dev.bacon.app.MainActivity',
          customAppId: 'dev.bacon.app.free',
        },
      })
    ).toStrictEqual({
      url: 'dev.bacon.app.free/dev.bacon.app.MainActivity',
    });

    // Ensure these custom launch props are reused when opening again
    expect(await platform.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'dev.bacon.app.free/dev.bacon.app.MainActivity',
    });
  });
});
