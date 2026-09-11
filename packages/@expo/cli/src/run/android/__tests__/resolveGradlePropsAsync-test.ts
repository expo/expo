import type { Device } from '../../../start/platforms/android/adb';
import { DeviceABI, getDeviceABIsAsync } from '../../../start/platforms/android/adb';
import { CommandError } from '../../../utils/errors';
import { resolveGradlePropsAsync } from '../resolveGradlePropsAsync';

jest.mock('../../../start/platforms/android/adb', () => ({
  DeviceABI: jest.requireActual('../../../start/platforms/android/adb').DeviceABI,
  getDeviceABIsAsync: jest.fn(),
}));

const testDevice: Device = { name: 'Test', type: 'emulator', isAuthorized: true, isBooted: true };

describe(resolveGradlePropsAsync, () => {
  it('rejects a non-string variant', async () => {
    await expect(
      // @ts-expect-error JavaScript callers can pass a non-string variant.
      resolveGradlePropsAsync({ variant: 123 }, testDevice)
    ).rejects.toThrow(CommandError);
  });

  it.each([undefined, 'debug', 'Release', 'freeDebug', 'paidRelease', 'firstSecondThird'])(
    'uses Gradle architecture defaults when allArch is enabled for %s',
    async (variant) => {
      expect(await resolveGradlePropsAsync({ variant, allArch: true }, testDevice)).toEqual({
        appName: 'app',
        architectures: '',
      });
      expect(getDeviceABIsAsync).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, 'debug', 'freeDebug', 'debugOptimized', 'previewDebugOptimized'])(
    'uses the first compatible device architecture for %s',
    async (variant) => {
      jest
        .mocked(getDeviceABIsAsync)
        .mockResolvedValueOnce([DeviceABI.armeabi, DeviceABI.arm64v8a, DeviceABI.x86]);
      expect(await resolveGradlePropsAsync({ variant }, testDevice)).toEqual({
        appName: 'app',
        architectures: 'arm64-v8a',
      });
    }
  );

  it.each(['release', 'Release', 'paidRelease', 'preview'])(
    'uses Gradle architecture defaults for %s',
    async (variant) => {
      expect(await resolveGradlePropsAsync({ variant }, testDevice)).toEqual({
        appName: 'app',
        architectures: '',
      });
      expect(getDeviceABIsAsync).not.toHaveBeenCalled();
    }
  );

  it('uses the Gradle architecture defaults when the device has no supported ABI', async () => {
    jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.armeabi]);
    expect(await resolveGradlePropsAsync({}, testDevice)).toEqual({
      appName: 'app',
      architectures: '',
    });
  });
});
