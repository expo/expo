import { asMock } from '../../../__tests__/asMock';
import { getVersionsAsync, SDKVersion, Versions } from '../../../api/getVersions';
import { downloadExpoGoAsync } from '../../../utils/downloadExpoGoAsync';
import { CommandError } from '../../../utils/errors';
import { confirmAsync } from '../../../utils/prompts';
import { ExpoGoInstaller } from '../ExpoGoInstaller';

jest.mock('../../../log');
jest.mock('../../../utils/prompts');
jest.mock('../../../utils/downloadExpoGoAsync');
jest.mock('../../../api/getVersions', () => ({
  getVersionsAsync: jest.fn(),
}));

beforeEach(() => {
  // Reset global memo...
  ExpoGoInstaller.cache = {};
});

function createInstaller(platform: 'ios' | 'android') {
  return new ExpoGoInstaller(platform, 'host.fake.expo', '44.0.0');
}

function mockVersionsOnce(versions: Partial<Versions>) {
  asMock(getVersionsAsync).mockResolvedValueOnce(asVersions(versions));
}

function asVersions(versions: Partial<Versions>): Versions {
  return versions as Versions;
}

describe('_getExpectedClientVersionAsync', () => {
  it(`returns null when version cannot be found`, async () => {
    mockVersionsOnce({});
    await expect(createInstaller('android')._getExpectedClientVersionAsync()).resolves.toBe(null);
  });
  describe('android', () => {
    it(`uses platform and most specific version`, async () => {
      mockVersionsOnce({
        androidVersion: '2.0.0',
        sdkVersions: {
          '44.0.0': {
            androidClientVersion: '1.0.0',
          } as SDKVersion,
        },
      });
      await expect(createInstaller('android')._getExpectedClientVersionAsync()).resolves.toBe(
        '1.0.0'
      );
    });
    it(`uses platform and general version`, async () => {
      mockVersionsOnce({
        androidVersion: '2.0.0',
        sdkVersions: {},
      });
      await expect(createInstaller('android')._getExpectedClientVersionAsync()).resolves.toBe(
        '2.0.0'
      );
    });
  });
  describe('ios', () => {
    it(`uses platform and most specific version`, async () => {
      mockVersionsOnce({
        iosVersion: '2.0.0',
        sdkVersions: {
          '44.0.0': {
            iosClientVersion: '1.0.0',
          } as SDKVersion,
        },
      });

      await expect(createInstaller('ios')._getExpectedClientVersionAsync()).resolves.toBe('1.0.0');
    });
    it(`uses platform and general version`, async () => {
      mockVersionsOnce({
        iosVersion: '2.0.0',
        sdkVersions: {},
      });
      await expect(createInstaller('ios')._getExpectedClientVersionAsync()).resolves.toBe('2.0.0');
    });
  });
});

describe('isClientOutdatedAsync', () => {
  it(`returns true if the app is not installed`, async () => {
    // platform doesn't matter here...
    const installer = createInstaller('android');
    installer._getExpectedClientVersionAsync = jest.fn();
    const deviceManager = {
      getAppVersionAsync: jest.fn(async () => null),
    } as any;
    await expect(installer.isClientOutdatedAsync(deviceManager)).resolves.toBe(true);
    expect(installer._getExpectedClientVersionAsync).toBeCalledTimes(0);
  });
  it(`returns true if the installed Expo Go app is outdated`, async () => {
    // platform doesn't matter here...
    const installer = createInstaller('android');
    installer._getExpectedClientVersionAsync = jest.fn(async () => '2.0.0');
    const deviceManager = {
      getAppVersionAsync: jest.fn(async () => '1.0.0'),
    } as any;
    await expect(installer.isClientOutdatedAsync(deviceManager)).resolves.toBe(true);
    expect(installer._getExpectedClientVersionAsync).toBeCalledTimes(1);
  });
  it(`returns false if the installed Expo Go app version is up to date`, async () => {
    // platform doesn't matter here...
    const installer = createInstaller('android');
    installer._getExpectedClientVersionAsync = jest.fn(async () => '2.0.0');
    const deviceManager = {
      getAppVersionAsync: jest.fn(async () => '2.0.0'),
    } as any;
    await expect(installer.isClientOutdatedAsync(deviceManager)).resolves.toBe(false);
    expect(installer._getExpectedClientVersionAsync).toBeCalledTimes(1);
  });
});

describe('uninstallExpoGoIfOutdatedAsync', () => {
  function createDeviceManager() {
    return {
      name: 'Pixel 3',
      identifier: '123',
      uninstallAppAsync: jest.fn(async () => null),
    } as any;
  }
  it(`returns true when the user uninstalls the outdated app`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(true);
    const installer = createInstaller('android');
    installer.isClientOutdatedAsync = jest.fn(async () => true);
    const deviceManager = createDeviceManager();

    await expect(installer.uninstallExpoGoIfOutdatedAsync(deviceManager)).resolves.toBe(true);
    expect(confirmAsync).toBeCalled();
    expect(deviceManager.uninstallAppAsync).toBeCalled();
  });

  it(`prevents checking the same device twice`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(true);
    const installer = createInstaller('android');
    installer.isClientOutdatedAsync = jest.fn(async () => true);
    const deviceManager = createDeviceManager();
    await expect(installer.uninstallExpoGoIfOutdatedAsync(deviceManager)).resolves.toBe(true);
    expect(confirmAsync).toBeCalled();

    // Returns false bacuse the device is already checked.
    await expect(installer.uninstallExpoGoIfOutdatedAsync(deviceManager)).resolves.toBe(false);
    expect(confirmAsync).toBeCalledTimes(1);
  });

  it(`returns false when the user uninstalls the outdated app`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(false);
    const installer = createInstaller('android');
    installer.isClientOutdatedAsync = jest.fn(async () => true);
    const deviceManager = createDeviceManager();
    await expect(installer.uninstallExpoGoIfOutdatedAsync(deviceManager)).resolves.toBe(false);
    expect(confirmAsync).toBeCalled();
    expect(deviceManager.uninstallAppAsync).not.toBeCalled();
  });

  it(`does not actually uninstall the outdated app on iOS`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(true);
    const installer = createInstaller('ios');
    installer.isClientOutdatedAsync = jest.fn(async () => true);
    const deviceManager = createDeviceManager();
    await expect(installer.uninstallExpoGoIfOutdatedAsync(deviceManager)).resolves.toBe(true);
    expect(confirmAsync).toBeCalled();
    // Not called because we simply install the new app which automatically overwrites the old one.
    expect(deviceManager.uninstallAppAsync).not.toBeCalled();
  });
  it(`does not prompt if the app is not up to date`, async () => {
    asMock(confirmAsync).mockImplementationOnce(() => {
      throw new Error('Should not be called');
    });
    const installer = createInstaller('ios');
    installer.isClientOutdatedAsync = jest.fn(async () => false);
    const deviceManager = createDeviceManager();
    await expect(installer.uninstallExpoGoIfOutdatedAsync(deviceManager)).resolves.toBe(false);
    expect(confirmAsync).not.toBeCalled();
    expect(deviceManager.uninstallAppAsync).not.toBeCalled();
  });
});

describe('ensureAsync', () => {
  function createDeviceManager(isAppInstalled: boolean) {
    return {
      name: 'Pixel 3',
      identifier: '123',
      isAppInstalledAsync: jest.fn(async () => isAppInstalled),
      installAppAsync: jest.fn(async () => {}),
    } as any;
  }

  it(`returns true if the app was updated (after being updated)`, async () => {
    // true because the app is installed.
    const deviceManager = createDeviceManager(true);

    const installer = createInstaller('android');
    // Return true to indicate that the app was uninstalled.
    installer.uninstallExpoGoIfOutdatedAsync = jest.fn(async () => true);

    await expect(installer.ensureAsync(deviceManager)).resolves.toBe(true);

    expect(downloadExpoGoAsync).toBeCalledTimes(1);
    expect(deviceManager.installAppAsync).toBeCalled();
  });

  it(`returns true if the app was installed`, async () => {
    // false because the app is not installed
    const deviceManager = createDeviceManager(false);

    const installer = createInstaller('android');

    // App is not installed so we shouldn't check if it's outdated.
    // This is important because skipping this means we skipped the cache and prompt.
    installer.uninstallExpoGoIfOutdatedAsync = () => {
      throw new Error('Should not be called');
    };

    await expect(installer.ensureAsync(deviceManager)).resolves.toBe(true);

    expect(downloadExpoGoAsync).toBeCalledTimes(1);
    expect(deviceManager.installAppAsync).toBeCalled();
  });

  it(`returns false if the app is up to date`, async () => {
    // true because the app is up to date.
    const deviceManager = createDeviceManager(true);

    const installer = createInstaller('android');

    // Return false to indicate that the app was not uninstalled
    installer.uninstallExpoGoIfOutdatedAsync = jest.fn(async () => false);

    await expect(installer.ensureAsync(deviceManager)).resolves.toBe(false);

    // No expensive actions.
    expect(downloadExpoGoAsync).not.toBeCalled();
    expect(deviceManager.installAppAsync).not.toBeCalled();
  });

  it(`returns false when installed and running in offline mode`, async () => {
    jest.resetModules();
    jest.mock('../../../api/settings', () => ({ APISettings: { isOffline: true } }));

    // Reload the Expo Go installer to use the mocked settings
    const { ExpoGoInstaller } = require('../ExpoGoInstaller');

    const deviceManager = createDeviceManager(true);
    const installer = new ExpoGoInstaller('android', 'host.fake.expo', '44.0.0');

    // Return false and allow the test to validate this is not called
    installer.uninstallExpoGoIfOutdatedAsync = jest.fn(async () => false);

    await expect(installer.ensureAsync(deviceManager)).resolves.toBe(false);

    // Ensure it avoids making any API requests
    expect(installer.uninstallExpoGoIfOutdatedAsync).not.toBeCalled();
    expect(downloadExpoGoAsync).not.toBeCalled();
  });

  it(`throws when not installed and running in offline mode`, async () => {
    jest.resetModules();
    jest.mock('../../../api/settings', () => ({ APISettings: { isOffline: true } }));

    // Reload the Expo Go installer to use the mocked settings
    const { ExpoGoInstaller } = require('../ExpoGoInstaller');

    const deviceManager = createDeviceManager(false);
    const installer = new ExpoGoInstaller('android', 'host.fake.expo', '44.0.0');

    // Return false and allow the test to validate this is not called
    installer.uninstallExpoGoIfOutdatedAsync = jest.fn(async () => false);

    await expect(installer.ensureAsync(deviceManager)).rejects.toThrowError(
      'Expo Go is not installed'
    );
  });
});
