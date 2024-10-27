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
  it(`throws when variant is not a string`, async () => {
    await expect(resolveGradlePropsAsync('/', { variant: 123 as any }, testDevice)).rejects.toThrow(
      CommandError
    );
  });

  it('returns without variant', async () => {
    expect(await resolveGradlePropsAsync('/', { allArch: true }, testDevice)).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
      architectures: '',
    });
  });

  it('returns with standard variant "debug" and "release"', async () => {
    expect(
      await resolveGradlePropsAsync('/', { variant: 'debug', allArch: true }, testDevice)
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
      architectures: '',
    });
    expect(
      await resolveGradlePropsAsync('/', { variant: 'Release', allArch: true }, testDevice)
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/release',
      appName: 'app',
      buildType: 'release',
      flavors: [],
      architectures: '',
    });
  });

  // See: https://developer.android.com/build/build-variants?utm_source=android-studio#resolve_matching_errors
  it('returns with custom product flavored variant "free" and "paid"', async () => {
    expect(
      await resolveGradlePropsAsync('/', { variant: 'freeDebug', allArch: true }, testDevice)
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/free/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: ['free'],
      architectures: '',
    });
    expect(
      await resolveGradlePropsAsync('/', { variant: 'paidRelease', allArch: true }, testDevice)
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/paid/release',
      appName: 'app',
      buildType: 'release',
      flavors: ['paid'],
      architectures: '',
    });
  });

  it('returns with highly custom variant "firstSecondThird"', async () => {
    expect(
      await resolveGradlePropsAsync('/', { variant: 'firstSecondThird', allArch: true }, testDevice)
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/first/second/third',
      appName: 'app',
      buildType: 'third',
      flavors: ['first', 'second'],
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

  it(`returns unique device ABIs`, async () => {
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
