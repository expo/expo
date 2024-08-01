import {
  DeviceABI,
  getDeviceABIsAsync,
  getAttachedDevicesAsync,
  Device,
} from '../../../start/platforms/android/adb';
import { CommandError } from '../../../utils/errors';
import { resolveGradlePropsAsync } from '../resolveGradlePropsAsync';

jest.mock('../../../start/platforms/android/adb', () => ({
  DeviceABI: jest.requireActual('../../../start/platforms/android/adb').DeviceABI,
  getDeviceABIsAsync: jest.fn(),
  getAttachedDevicesAsync: jest.fn(),
}));

const testDevice: Device = { name: 'Test', type: 'emulator', isAuthorized: true, isBooted: true };

describe(resolveGradlePropsAsync, () => {
  it(`asserts variant`, async () => {
    await expect(
      resolveGradlePropsAsync(
        '/',
        {
          // @ts-expect-error
          variant: 123,
        },
        testDevice
      )
    ).rejects.toThrowError(CommandError);
  });
  it(`parses flavors`, async () => {
    expect(
      await resolveGradlePropsAsync('/', { variant: 'firstSecondThird', allArch: true }, testDevice)
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/second/third/first',
      appName: 'app',
      buildType: 'first',
      flavors: ['second', 'third'],
      architectures: '',
    });
  });

  it(`parses with no variant`, async () => {
    expect(await resolveGradlePropsAsync('/', { allArch: true }, testDevice)).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
      architectures: '',
    });
  });

  it(`returns the device architectures in a comma separated string`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([testDevice]);
    jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.armeabiV7a, DeviceABI.x86]);

    expect(await resolveGradlePropsAsync('/', {}, testDevice)).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
      architectures: 'armeabi-v7a,x86',
    });
  });

  it(`should filter out duplicate abis`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([testDevice]);
    jest
      .mocked(getDeviceABIsAsync)
      .mockResolvedValueOnce([
        DeviceABI.x86,
        DeviceABI.arm64v8a,
        DeviceABI.arm64v8a,
        DeviceABI.x8664,
        DeviceABI.x8664,
      ]);

    expect(await resolveGradlePropsAsync('/', {}, testDevice)).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
      architectures: 'x86,arm64-v8a,x86_64',
    });
  });
});
