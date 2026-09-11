import { CommandError } from '../../../../utils/errors';
import { AndroidDeviceManager } from '../AndroidDeviceManager';
import type { Device } from '../adb';
import {
  getPackageInfoAsync,
  installAsync,
  isDeviceBootedAsync,
  launchActivityAsync,
  logUnauthorized,
  openUrlAsync,
} from '../adb';
import { startDeviceAsync } from '../emulator';
import { getDevicesAsync } from '../getDevices';
import { shellDumpsysPackage } from './fixtures/adb-output';

jest.mock('../adbReverse', () => ({
  startAdbReverseAsync: jest.fn(),
}));
jest.mock('../adb', () => ({
  getPackageInfoAsync: jest.fn(),
  launchActivityAsync: jest.fn(),
  openAppIdAsync: jest.fn(),
  openUrlAsync: jest.fn(),
  installAsync: jest.fn(),
  isPackageInstalledAsync: jest.fn(),
  isDeviceBootedAsync: jest.fn(),
  logUnauthorized: jest.fn(),
}));
jest.mock('../emulator', () => ({ startDeviceAsync: jest.fn() }));
jest.mock('../getDevices', () => ({ getDevicesAsync: jest.fn() }));

const asDevice = (device: Partial<Device>): Device => device as Device;

function createDevice() {
  return new AndroidDeviceManager(asDevice({ name: 'Pixel 5', pid: '123' }));
}

describe('device resolution', () => {
  it('launches only an explicit AVD inventory record', async () => {
    const avd = asDevice({
      name: 'Pixel_API_35',
      type: 'emulator',
      isLaunchable: true,
      isBooted: false,
      isAuthorized: true,
    });
    const attached = asDevice({
      ...avd,
      pid: 'emulator-5554',
      state: 'device',
      transportId: '4',
      isLaunchable: false,
      isBooted: true,
    });
    jest.mocked(startDeviceAsync).mockResolvedValueOnce(attached);

    await expect(AndroidDeviceManager.resolveAsync({ device: avd })).resolves.toMatchObject({
      device: attached,
    });
    expect(startDeviceAsync).toHaveBeenCalledWith(avd);
    expect(isDeviceBootedAsync).toHaveBeenCalledWith(avd);
  });

  it('does not relaunch an AVD that became attached after inventory', async () => {
    const avd = asDevice({
      name: 'Pixel_API_35',
      type: 'emulator',
      isLaunchable: true,
      isBooted: false,
      isAuthorized: true,
    });
    const attached = asDevice({
      ...avd,
      pid: 'emulator-5554',
      state: 'device',
      isLaunchable: false,
      isBooted: true,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(attached);

    await expect(AndroidDeviceManager.resolveAsync({ device: avd })).resolves.toMatchObject({
      device: attached,
    });
    expect(startDeviceAsync).not.toHaveBeenCalled();
  });

  it('reports a booting AVD that became attached after inventory as unready', async () => {
    const avd = asDevice({
      name: 'Pixel_API_35',
      type: 'emulator',
      isLaunchable: true,
      isBooted: false,
      isAuthorized: true,
    });
    const booting = asDevice({
      ...avd,
      pid: 'emulator-5554',
      state: 'offline',
      isLaunchable: false,
      isAuthorized: false,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(booting);

    await expect(AndroidDeviceManager.resolveAsync({ device: avd })).rejects.toThrow(
      /emulator-5554 is in state offline.*Wait until ADB reports the emulator as ready/s
    );
    expect(startDeviceAsync).not.toHaveBeenCalled();
    expect(logUnauthorized).not.toHaveBeenCalled();
  });

  it('keeps the authorization flow for an unauthorized AVD that became attached', async () => {
    const avd = asDevice({
      name: 'Pixel_API_35',
      type: 'emulator',
      isLaunchable: true,
      isBooted: false,
      isAuthorized: true,
    });
    const attached = asDevice({
      ...avd,
      pid: 'emulator-5554',
      state: 'unauthorized',
      isLaunchable: false,
      isAuthorized: false,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(attached);

    await expect(AndroidDeviceManager.resolveAsync({ device: avd })).rejects.toThrow(
      /emulator-5554 is unauthorized.*Authorize this computer/s
    );
    expect(logUnauthorized).toHaveBeenCalledWith(attached);
    expect(startDeviceAsync).not.toHaveBeenCalled();
  });

  it.each(['offline', 'future-state'])(
    'rejects an attached %s transport without entering the AVD launch path',
    async (state) => {
      const physical = asDevice({
        name: 'Device USB-1',
        pid: 'USB-1',
        type: 'device',
        state,
        isLaunchable: false,
        isAuthorized: true,
      });

      await expect(AndroidDeviceManager.resolveAsync({ device: physical })).rejects.toThrow(state);
      expect(startDeviceAsync).not.toHaveBeenCalled();
      expect(isDeviceBootedAsync).not.toHaveBeenCalled();
    }
  );

  it('preserves the dedicated authorization flow for an attached unauthorized device', async () => {
    const physical = asDevice({
      name: 'Device USB-1',
      pid: 'USB-1',
      type: 'device',
      state: 'unauthorized',
      isLaunchable: false,
      isAuthorized: false,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(physical);

    await expect(AndroidDeviceManager.resolveAsync({ device: physical })).rejects.toThrow(
      /Device USB-1 is unauthorized.*Authorize this computer/s
    );
    expect(logUnauthorized).toHaveBeenCalledWith(physical);
    expect(startDeviceAsync).not.toHaveBeenCalled();
  });

  it('reports disappearance after discovery without launching or replaying', async () => {
    const physical = asDevice({
      name: 'Pixel USB',
      pid: 'USB-1',
      type: 'device',
      state: 'device',
      transportId: '4',
      isLaunchable: false,
      isAuthorized: true,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(null);

    await expect(AndroidDeviceManager.resolveAsync({ device: physical })).rejects.toThrow(
      /Device not found after discovery/
    );
    expect(startDeviceAsync).not.toHaveBeenCalled();
  });

  it('uses a freshly rediscovered physical transport without launching an emulator', async () => {
    const physical = asDevice({
      name: 'Pixel USB',
      pid: 'USB-1',
      type: 'device',
      state: 'device',
      transportId: '4',
      isLaunchable: false,
      isAuthorized: true,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(physical);

    await expect(AndroidDeviceManager.resolveAsync({ device: physical })).resolves.toMatchObject({
      device: physical,
    });
    expect(startDeviceAsync).not.toHaveBeenCalled();
  });

  it('reports transport replacement after discovery', async () => {
    const physical = asDevice({
      name: 'Pixel USB',
      pid: 'USB-1',
      type: 'device',
      state: 'device',
      transportId: '4',
      isLaunchable: false,
      isAuthorized: true,
    });
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce({ ...physical, transportId: '5' });

    await expect(AndroidDeviceManager.resolveAsync({ device: physical })).rejects.toThrow(
      /transport 4 became 5/
    );
    expect(startDeviceAsync).not.toHaveBeenCalled();
  });

  it('maps a post-selection device-not-found error without replaying install', async () => {
    const manager = createDevice();
    jest.mocked(installAsync).mockRejectedValueOnce(new Error('error: device not found'));

    await expect(manager.installAppAsync('/tmp/app.apk')).rejects.toThrow(
      /The device disconnected. Reconnect it and try again./
    );
    expect(installAsync).toHaveBeenCalledTimes(1);
  });
});

describe('resolveFromNameAsync', () => {
  it('resolves a physical device by serial', async () => {
    const device = asDevice({
      name: 'moto_g55_5G',
      pid: 'ZY22KPLGQ9',
      type: 'device',
      state: 'device',
      isAuthorized: true,
      isBooted: true,
    });
    jest.mocked(getDevicesAsync).mockResolvedValueOnce([device]);
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(device);

    const manager = await AndroidDeviceManager.resolveFromNameAsync('ZY22KPLGQ9');
    expect(manager.device.pid).toBe('ZY22KPLGQ9');
  });

  it('resolves a physical device by name', async () => {
    const device = asDevice({
      name: 'moto_g55_5G',
      pid: 'ZY22KPLGQ9',
      type: 'device',
      state: 'device',
      isAuthorized: true,
      isBooted: true,
    });
    jest.mocked(getDevicesAsync).mockResolvedValueOnce([device]);
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(device);

    const manager = await AndroidDeviceManager.resolveFromNameAsync('moto_g55_5G');
    expect(manager.device.pid).toBe('ZY22KPLGQ9');
  });

  it('prefers a serial match over a name match', async () => {
    const deviceNamedX = asDevice({
      name: 'X',
      pid: 'other-serial',
      type: 'device',
      state: 'device',
      isAuthorized: true,
      isBooted: true,
    });
    const deviceWithSerialX = asDevice({
      name: 'other-name',
      pid: 'X',
      type: 'device',
      state: 'device',
      isAuthorized: true,
      isBooted: true,
    });
    jest.mocked(getDevicesAsync).mockResolvedValueOnce([deviceNamedX, deviceWithSerialX]);
    jest.mocked(isDeviceBootedAsync).mockResolvedValueOnce(deviceWithSerialX);

    const manager = await AndroidDeviceManager.resolveFromNameAsync('X');
    expect(manager.device.pid).toBe('X');
    expect(manager.device.name).toBe('other-name');
  });

  it('rejects with an actionable error when no device matches', async () => {
    const device = asDevice({
      name: 'Pixel 5',
      pid: '123',
      type: 'device',
      state: 'device',
      isAuthorized: true,
      isBooted: true,
    });
    jest.mocked(getDevicesAsync).mockResolvedValue([device]);

    await expect(AndroidDeviceManager.resolveFromNameAsync('nonsense')).rejects.toThrow(
      /nonsense/s
    );
    await expect(AndroidDeviceManager.resolveFromNameAsync('nonsense')).rejects.toThrow(
      /Pixel 5.*123/s
    );
    await expect(AndroidDeviceManager.resolveFromNameAsync('nonsense')).rejects.toThrow(
      /--device/s
    );
  });
});

describe('getAppVersionAsync', () => {
  it(`gets the version from an installed app`, async () => {
    const device = createDevice();
    jest.mocked(getPackageInfoAsync).mockResolvedValueOnce(shellDumpsysPackage);
    await expect(device.getAppVersionAsync('foobar')).resolves.toBe('2.23.2');
  });
  it(`returns null when the app is not installed`, async () => {
    const device = createDevice();
    jest.mocked(getPackageInfoAsync).mockResolvedValueOnce('');
    await expect(device.getAppVersionAsync('foobar')).resolves.toBe(null);
  });
});

describe('launchActivityAsync', () => {
  it(`asserts that the app is not installed`, async () => {
    const device = createDevice();
    jest.mocked(launchActivityAsync).mockImplementationOnce(() => {
      throw new CommandError('APP_NOT_INSTALLED', '...');
    });
    await expect(device.launchActivityAsync('dev.expo.test/.MainActivity')).rejects.toThrow(
      /run:android/
    );
  });
  it(`asserts that an unexpected error occurred`, async () => {
    const device = createDevice();
    jest.mocked(launchActivityAsync).mockImplementationOnce(() => {
      throw new Error('...');
    });
    await expect(device.launchActivityAsync('dev.expo.test/.MainActivity')).rejects.toThrow(
      /\.\.\./
    );
  });
  it(`launches activity with provided props`, async () => {
    const device = createDevice();
    await expect(
      device.launchActivityAsync(
        'dev.expo.test/.MainActivity',
        'exp+expo-test://expo-development-client/?url=http%3A%2F%2F192.168.86.186%3A8081'
      )
    ).resolves.toBeUndefined();
    expect(launchActivityAsync).toHaveBeenCalledWith(
      expect.anything(), // Device context
      expect.objectContaining({
        launchActivity: 'dev.expo.test/.MainActivity',
        url: 'exp+expo-test://expo-development-client/?url=http%3A%2F%2F192.168.86.186%3A8081',
      }),
      expect.any(AbortSignal)
    );
  });
});

describe('openUrlAsync', () => {
  it('opens Expo Go before launching into Expo Go', async () => {
    const device = createDevice();
    await device.openUrlAsync('exp://foobar');
    expect(launchActivityAsync).toHaveBeenCalledWith(
      { pid: '123' },
      { launchActivity: 'host.exp.exponent/.experience.HomeActivity' },
      expect.any(AbortSignal)
    );
    expect(openUrlAsync).toHaveBeenCalledWith(
      { pid: '123' },
      { url: 'exp://foobar' },
      expect.any(AbortSignal)
    );
  });
  it('opens a URL on a device', async () => {
    const device = createDevice();
    await device.openUrlAsync('http://foobar');
    expect(launchActivityAsync).not.toHaveBeenCalled();
    expect(openUrlAsync).toHaveBeenCalledWith(
      { pid: '123' },
      { url: 'http://foobar' },
      expect.any(AbortSignal)
    );
  });
  it('launches nonstandard URL', async () => {
    const device = createDevice();
    // @ts-expect-error
    device.launchActivityAsync = jest.fn(async () => {});
    await device.openUrlAsync('@foobar');
    expect(device.launchActivityAsync).toHaveBeenCalledWith('@foobar');
  });
});
