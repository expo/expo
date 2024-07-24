import { vol } from 'memfs';

import { DeviceABI, getDeviceABIsAsync } from '../../../start/platforms/android/adb';
import { resolveInstallApkNameAsync } from '../resolveInstallApkName';

jest.mock('../../../start/platforms/android/adb', () => ({
  DeviceABI: jest.requireActual('../../../start/platforms/android/adb').DeviceABI,
  getDeviceABIsAsync: jest.fn(),
}));

describe(resolveInstallApkNameAsync, () => {
  afterEach(() => vol.reset());

  const runCheck = () =>
    resolveInstallApkNameAsync(
      {
        name: 'foobar',
        pid: '1',
      },
      {
        appName: 'app',
        buildType: 'debug',
        apkVariantDirectory: '/android/app/build/outputs/apk/debug',
        architectures: '',
      }
    );
  it(`resolves an APK using cpu-less name`, async () => {
    vol.fromJSON(
      {
        'android/app/build/outputs/apk/debug/app-debug.apk': '',
      },
      '/'
    );
    jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64, DeviceABI.x86]);
    await expect(runCheck()).resolves.toBe('app-debug.apk');
  });
  it(`resolves an APK using universal cpu name`, async () => {
    vol.fromJSON(
      {
        'android/app/build/outputs/apk/debug/app-universal-debug.apk': '',
        'android/app/build/outputs/apk/debug/app-debug.apk': '',
      },
      '/'
    );
    jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([]);
    await expect(runCheck()).resolves.toBe('app-universal-debug.apk');
  });
  it(`resolves an APK using custom cpu name`, async () => {
    vol.fromJSON(
      {
        'android/app/build/outputs/apk/debug/app-arm64-debug.apk': '',
        'android/app/build/outputs/apk/debug/app-universal-debug.apk': '',
        'android/app/build/outputs/apk/debug/app-debug.apk': '',
      },
      '/'
    );
    jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64]);
    await expect(runCheck()).resolves.toBe('app-arm64-debug.apk');
  });
});
