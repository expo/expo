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

  describe('output-metadata.json fallback', () => {
    it(`resolves a custom-named APK when no pattern-based APK is found`, async () => {
      vol.fromJSON(
        {
          'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
            elements: [
              { type: 'SINGLE', filters: [], outputFile: 'myapp-1.0.0-100-abc1234-debug.apk' },
            ],
          }),
          'android/app/build/outputs/apk/debug/myapp-1.0.0-100-abc1234-debug.apk': '',
        },
        '/'
      );
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64]);
      await expect(runCheck()).resolves.toBe('myapp-1.0.0-100-abc1234-debug.apk');
    });

    it(`resolves an ABI-split APK matching the device ABI`, async () => {
      vol.fromJSON(
        {
          'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
            elements: [
              {
                type: 'ONE_OF_MANY',
                filters: [{ filterType: 'ABI', value: 'arm64-v8a' }],
                outputFile: 'myapp-arm64-v8a-debug.apk',
              },
              {
                type: 'ONE_OF_MANY',
                filters: [{ filterType: 'ABI', value: 'x86_64' }],
                outputFile: 'myapp-x86_64-debug.apk',
              },
            ],
          }),
          'android/app/build/outputs/apk/debug/myapp-arm64-v8a-debug.apk': '',
          'android/app/build/outputs/apk/debug/myapp-x86_64-debug.apk': '',
        },
        '/'
      );
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64v8a]);
      await expect(runCheck()).resolves.toBe('myapp-arm64-v8a-debug.apk');
    });

    it(`returns null when output-metadata.json is absent and no pattern-based APK is found`, async () => {
      vol.fromJSON({}, '/');
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64]);
      await expect(runCheck()).resolves.toBeNull();
    });

    it(`returns null when output-metadata.json is malformed`, async () => {
      vol.fromJSON(
        { 'android/app/build/outputs/apk/debug/output-metadata.json': 'not valid json' },
        '/'
      );
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64]);
      await expect(runCheck()).resolves.toBeNull();
    });

    it(`returns null when no ABI split element matches the device`, async () => {
      vol.fromJSON(
        {
          'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
            elements: [
              {
                type: 'ONE_OF_MANY',
                filters: [{ filterType: 'ABI', value: 'x86_64' }],
                outputFile: 'myapp-x86_64-debug.apk',
              },
            ],
          }),
          'android/app/build/outputs/apk/debug/myapp-x86_64-debug.apk': '',
        },
        '/'
      );
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64v8a]);
      await expect(runCheck()).resolves.toBeNull();
    });

    it(`returns null when the APK referenced by output-metadata.json does not exist on disk`, async () => {
      vol.fromJSON(
        {
          'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
            elements: [{ type: 'SINGLE', filters: [], outputFile: 'myapp-1.0.0-debug.apk' }],
          }),
          // APK file intentionally absent
        },
        '/'
      );
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64]);
      await expect(runCheck()).resolves.toBeNull();
    });

    it(`returns null for density splits when no ABI filter is present`, async () => {
      vol.fromJSON(
        {
          'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
            elements: [
              {
                type: 'ONE_OF_MANY',
                filters: [{ filterType: 'DENSITY', value: 'hdpi' }],
                outputFile: 'myapp-hdpi-debug.apk',
              },
              {
                type: 'ONE_OF_MANY',
                filters: [{ filterType: 'DENSITY', value: 'xhdpi' }],
                outputFile: 'myapp-xhdpi-debug.apk',
              },
            ],
          }),
          'android/app/build/outputs/apk/debug/myapp-hdpi-debug.apk': '',
          'android/app/build/outputs/apk/debug/myapp-xhdpi-debug.apk': '',
        },
        '/'
      );
      jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce([DeviceABI.arm64v8a]);
      await expect(runCheck()).resolves.toBeNull();
    });
  });
});
