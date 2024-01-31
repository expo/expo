import {
  DeviceABI,
  getDeviceABIsAsync,
  getAttachedDevicesAsync,
  Device,
} from '../../../start/platforms/android/adb';
import { CommandError } from '../../../utils/errors';
import { resolveGradleProps } from '../resolveGradleProps';

jest.mock('../../../start/platforms/android/adb', () => ({
  DeviceABI: jest.requireActual('../../../start/platforms/android/adb').DeviceABI,
  getDeviceABIsAsync: jest.fn(),
  getAttachedDevicesAsync: jest.fn(),
}));

const testDevice: Device = { name: 'Test', type: 'emulator', isAuthorized: true, isBooted: true };

describe(resolveGradleProps, () => {
  it(`asserts variant`, async () => {
    await expect(
      resolveGradleProps('/', {
        // @ts-expect-error
        variant: 123,
      })
    ).rejects.toThrowError(CommandError);
  });
  it(`parses flavors`, async () => {
    expect(await resolveGradleProps('/', { variant: 'firstSecondThird', allArch: true })).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/second/third/first',
      appName: 'app',
      buildType: 'first',
      flavors: ['second', 'third'],
      architectures: '',
    });
  });

  it(`parses with no variant`, async () => {
    expect(await resolveGradleProps('/', { allArch: true })).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
      architectures: '',
    });
  });

  it(`returns the device architectures in a comma separated string`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([testDevice]);
    jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64, DeviceABI.x86]);

    expect(await resolveGradleProps('/', { variant: 'firstSecondThird' })).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/second/third/first',
      appName: 'app',
      buildType: 'first',
      flavors: ['second', 'third'],
      architectures: 'arm64,x86',
    });
  });

  it(`should filter out duplicate abis`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([testDevice]);
    jest
      .mocked(getDeviceABIsAsync)
      .mockResolvedValueOnce([
        DeviceABI.arm64,
        DeviceABI.x86,
        DeviceABI.x86,
        DeviceABI.arm64,
        DeviceABI.armeabiV7a,
      ]);

    expect(await resolveGradleProps('/', { variant: 'firstSecondThird' })).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/second/third/first',
      appName: 'app',
      buildType: 'first',
      flavors: ['second', 'third'],
      architectures: 'arm64,x86,armeabi-v7a',
    });
  });
});
