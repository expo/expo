import * as Log from '../../../../log';
import { AppleDeviceManager } from '../AppleDeviceManager';
import { ApplePlatformManager } from '../ApplePlatformManager';
import { assertSystemRequirementsAsync } from '../assertSystemRequirements';
import * as SimControl from '../simctl';

jest.mock(`../../../../log`);
jest.mock('../simctl');
jest.mock(`../assertSystemRequirements`);
jest.mock('../../ExpoGoInstaller');
jest.mock('../ensureSimulatorAppRunning');
jest.mock('@expo/config', () => ({
  getConfig: () => ({ exp: { sdkVersion: '51.0.0' } }),
}));

afterAll(() => {
  AppleDeviceManager.resolveAsync = originalResolveDevice;
});

const originalResolveDevice = AppleDeviceManager.resolveAsync;

describe('openAsync', () => {
  beforeEach(() => {
    AppleDeviceManager.resolveAsync = jest.fn(
      async () => new AppleDeviceManager({ udid: '123', name: 'iPhone 13' } as any)
    );
  });

  it(`resolves device with osType iOS when opening Expo Go`, async () => {
    const manager = new ApplePlatformManager('/', 8081, {
      getCustomRuntimeUrl: jest.fn(() => null),
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(() => 'exp://localhost:8081'),
      getRedirectUrl: jest.fn(() => null),
    });
    manager._getAppIdResolver = jest.fn(
      () =>
        ({
          getAppIdAsync: jest.fn(() => 'host.exp.Exponent'),
        }) as any
    );

    await manager.openAsync({ runtime: 'expo' });

    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        device: expect.objectContaining({ osType: 'iOS' }),
      })
    );
  });

  it(`does not inject osType when opening custom runtime`, async () => {
    const getCustomRuntimeUrl = jest.fn(() => 'custom://path');
    const manager = new ApplePlatformManager('/', 8081, {
      getCustomRuntimeUrl,
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(),
      getRedirectUrl: jest.fn(() => null),
    });
    manager._getAppIdResolver = jest.fn(
      () =>
        ({
          getAppIdAsync: jest.fn(() => 'dev.bacon.app'),
        }) as any
    );

    await manager.openAsync({ runtime: 'custom' });

    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledWith(
      expect.not.objectContaining({
        device: expect.objectContaining({ osType: 'iOS' }),
      })
    );
  });

  it(`opens a project in a custom development client`, async () => {
    const getCustomRuntimeUrl = jest.fn(() => 'custom://path');
    const manager = new ApplePlatformManager('/', 8081, {
      getCustomRuntimeUrl,
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(),
    });
    manager._getAppIdResolver = jest.fn(
      () =>
        ({
          getAppIdAsync: jest.fn(() => 'dev.bacon.app'),
        }) as any
    );

    expect(await manager.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'custom://path',
    });

    // Internals
    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getCustomRuntimeUrl).toHaveBeenCalledTimes(1);
    expect(assertSystemRequirementsAsync).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*iPhone/));
  });

  it(`opens a project in a custom development client using app identifier`, async () => {
    const getCustomRuntimeUrl = jest.fn(() => null);
    const manager = new ApplePlatformManager('/', 8081, {
      getCustomRuntimeUrl,
      getDevServerUrl: jest.fn(),
      getExpoGoUrl: jest.fn(),
    });

    manager._getAppIdResolver = jest.fn(
      () =>
        ({
          getAppIdAsync: jest.fn(() => 'dev.bacon.app'),
        }) as any
    );

    Object.defineProperty(SimControl, 'openAppIdAsync', {
      value: jest.fn(async () => ({ status: 0 })),
    });

    expect(await manager.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'dev.bacon.app',
    });

    // Internals
    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(getCustomRuntimeUrl).toHaveBeenCalledTimes(1);
    expect(assertSystemRequirementsAsync).toHaveBeenCalledTimes(1);

    // Logging
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*iPhone/));

    // Native invocation
    expect(SimControl.openAppIdAsync).toHaveBeenCalledWith(
      { name: 'iPhone 13', udid: '123' },
      { appId: 'dev.bacon.app' }
    );
  });
});
