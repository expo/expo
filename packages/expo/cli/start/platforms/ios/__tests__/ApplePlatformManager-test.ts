import { vol } from 'memfs';

import { AppleDeviceManager } from '../AppleDeviceManager';
import { ApplePlatformManager } from '../ApplePlatformManager';

import * as Log from '../../../../log';
import { assertSystemRequirementsAsync } from '../assertSystemRequirements';
jest.mock('fs');
jest.mock(`../../../../log`);
jest.mock('../simctl');
jest.mock(`../assertSystemRequirements`);
jest.mock('../../ExpoGoInstaller');
jest.mock('../ensureSimulatorAppRunning');

const asMock = (fn: any): jest.Mock => fn;

const originalForceColor = process.env.FORCE_COLOR;

beforeAll(async () => {
  process.env.FORCE_COLOR = '0';
});

beforeEach(() => {
  vol.reset();
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  AppleDeviceManager.resolveAsync = originalResolveDevice;
});

const originalResolveDevice = AppleDeviceManager.resolveAsync;

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

function createPlatformManager() {
  const getDevServerUrl = jest.fn(() => 'http://localhost:19000/');
  const getManifestUrl = jest.fn(() => 'http://localhost:19000/');
  const manager = new ApplePlatformManager(
    '/',
    19000,
    getDevServerUrl,
    () => 'http://localhost:19000/loading',
    getManifestUrl
  );
  return { manager, getDevServerUrl, getManifestUrl };
}

describe('openAsync', () => {
  beforeEach(() => {
    asMock(assertSystemRequirementsAsync).mockReset();
    asMock(Log.log).mockReset();
    asMock(Log.warn).mockReset();
    asMock(Log.error).mockReset();
    AppleDeviceManager.resolveAsync = jest.fn(
      async () => new AppleDeviceManager({ udid: '123', name: 'iPhone 13' } as any)
    );
  });

  it(`opens a project in Expo Go`, async () => {
    const { manager, getDevServerUrl, getManifestUrl } = createPlatformManager();

    expect(await manager.openAsync({ runtime: 'expo' })).toStrictEqual({
      url: 'http://localhost:19000/',
    });

    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(assertSystemRequirementsAsync).toHaveBeenCalledTimes(1);
    expect(getManifestUrl).toHaveBeenCalledTimes(1);
    expect(getDevServerUrl).toHaveBeenCalledTimes(0);
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*iPhone/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });
  it(`opens a project in a web browser`, async () => {
    const { manager, getManifestUrl, getDevServerUrl } = createPlatformManager();

    expect(await manager.openAsync({ runtime: 'web' })).toStrictEqual({
      url: 'http://localhost:19000/',
    });

    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(assertSystemRequirementsAsync).toHaveBeenCalledTimes(1);
    expect(getDevServerUrl).toHaveBeenCalledTimes(1);
    expect(getManifestUrl).toHaveBeenCalledTimes(0);

    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*iPhone/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });
  it(`opens a project in a custom development client`, async () => {
    const { manager, getManifestUrl, getDevServerUrl } = createPlatformManager();

    expect(await manager.openAsync({ runtime: 'custom' })).toStrictEqual({
      url: 'http://localhost:19000/',
    });

    expect(AppleDeviceManager.resolveAsync).toHaveBeenCalledTimes(1);
    expect(assertSystemRequirementsAsync).toHaveBeenCalledTimes(1);
    expect(getDevServerUrl).toHaveBeenCalledTimes(0);
    expect(getManifestUrl).toHaveBeenCalledTimes(1);
    expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening.*on.*iPhone/));
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(Log.error).toHaveBeenCalledTimes(0);
  });
});
