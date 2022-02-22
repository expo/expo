import * as Log from '../../../../log';
import { AndroidDeviceManager } from '../AndroidDeviceManager';
import { AndroidPlatformManager } from '../AndroidPlatformManager';

jest.mock('fs');
jest.mock(`../../../../log`);
jest.mock('../adb');
jest.mock('../../ExpoGoInstaller');
// jest.mock('../ensureSimulatorAppRunning');

const asMock = (fn: any): jest.Mock => fn;

afterAll(() => {
  AndroidDeviceManager.resolveAsync = originalResolveDevice;
});

const originalResolveDevice = AndroidDeviceManager.resolveAsync;

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

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

  it(`opens a project in Expo Go`, async () => {
    const getExpoGoUrl = jest.fn(() => 'exp://localhost:19000/');
    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl: jest.fn(),
      getDevServerUrl: jest.fn(),
      getExpoGoUrl,
    });

    expect(await manager.openAsync({ runtime: 'expo' })).toStrictEqual({
      url: 'exp://localhost:19000/',
    });

    expect(AndroidDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getExpoGoUrl).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*Pixel 5/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });

  it(`opens a project in a web browser`, async () => {
    const getDevServerUrl = jest.fn(() => 'http://localhost:19000/');
    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl: jest.fn(),
      getDevServerUrl,
      getExpoGoUrl: jest.fn(),
    });

    expect(await manager.openAsync({ runtime: 'web' })).toStrictEqual({
      url: 'http://localhost:19000/',
    });

    expect(AndroidDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getDevServerUrl).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*Pixel 5/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });
  it(`opens a project in a custom development client`, async () => {
    const getCustomRuntimeUrl = jest.fn(() => 'custom://path');
    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl,
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(),
    });
    manager._getAppIdResolver = jest.fn(() => ({
      getAppIdAsync: jest.fn(() => 'dev.bacon.app'),
    }));

    expect(await manager.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'custom://path',
    });

    // Internals
    expect(AndroidDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getCustomRuntimeUrl).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*Pixel 5/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });

  it(`opens a project in a custom development client using app identifier`, async () => {
    const getCustomRuntimeUrl = jest.fn(() => null);
    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl,
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(),
    });
    manager._getAppIdResolver = jest.fn(() => ({
      getAppIdAsync: jest.fn(() => 'dev.bacon.app'),
    }));

    expect(await manager.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'dev.bacon.app/.MainActivity',
    });

    // Internals
    expect(AndroidDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getCustomRuntimeUrl).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*Pixel 5/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });
  it(`asserts the dev client is not installed when attempting to open`, async () => {
    const getCustomRuntimeUrl = jest.fn(() => null);
    AndroidDeviceManager.resolveAsync = jest.fn(async () => {
      const manager = new AndroidDeviceManager({ udid: '123', name: 'Pixel 5' } as any);
      manager.isAppInstalledAsync = jest.fn(() => Promise.resolve(false));
      return manager;
    });

    const manager = new AndroidPlatformManager('/', 19000, {
      getCustomRuntimeUrl,
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(),
    });

    manager._getAppIdResolver = jest.fn(() => ({
      getAppIdAsync: jest.fn(() => 'dev.bacon.app'),
    }));

    await expect(manager.openAsync({ runtime: 'custom' })).rejects.toThrowError(
      /The development client/
    );

    // Internals
    expect(AndroidDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getCustomRuntimeUrl).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledTimes(0);
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });
});
