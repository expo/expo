import { shellDumpsysPackage } from './fixtures/adb-output';
import { CommandError } from '../../../../utils/errors';
import { AndroidDeviceManager } from '../AndroidDeviceManager';
import {
  Device,
  getPackageInfoAsync,
  launchActivityAsync,
  openAppIdAsync,
  openUrlAsync,
} from '../adb';

jest.mock('../adbReverse', () => ({
  startAdbReverseAsync: jest.fn(),
}));
jest.mock('../adb', () => ({
  getPackageInfoAsync: jest.fn(),
  launchActivityAsync: jest.fn(),
  openAppIdAsync: jest.fn(),
  openUrlAsync: jest.fn(),
}));

const asDevice = (device: Partial<Device>): Device => device as Device;

function createDevice() {
  return new AndroidDeviceManager(asDevice({ name: 'Pixel 5', pid: '123' }));
}

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
    await expect(device.launchActivityAsync).rejects.toThrow(/run:android/);
  });
  it(`asserts that an unexpected error occurred`, async () => {
    const device = createDevice();
    jest.mocked(launchActivityAsync).mockImplementationOnce(() => {
      throw new Error('...');
    });
    await expect(device.launchActivityAsync).rejects.toThrow(/\.\.\./);
  });
});

describe('openUrlAsync', () => {
  it('opens Expo Go before launching into Expo Go', async () => {
    const device = createDevice();
    await device.openUrlAsync('exp://foobar');
    expect(openAppIdAsync).toBeCalledWith({ pid: '123' }, { applicationId: 'host.exp.exponent' });
    expect(openUrlAsync).toBeCalledWith({ pid: '123' }, { url: 'exp://foobar' });
  });
  it('opens a URL on a device', async () => {
    const device = createDevice();
    await device.openUrlAsync('http://foobar');
    expect(openAppIdAsync).not.toBeCalled();
    expect(openUrlAsync).toBeCalledWith({ pid: '123' }, { url: 'http://foobar' });
  });
  it('launches nonstandard URL', async () => {
    const device = createDevice();
    // @ts-expect-error
    device.launchActivityAsync = jest.fn(async () => {});
    await device.openUrlAsync('@foobar');
    expect(device.launchActivityAsync).toHaveBeenCalledWith('@foobar');
  });
});
