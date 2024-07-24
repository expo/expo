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
    expect(SimControl.openAppIdAsync).toBeCalledWith(
      { name: 'iPhone 13', udid: '123' },
      { appId: 'dev.bacon.app' }
    );
  });
});
