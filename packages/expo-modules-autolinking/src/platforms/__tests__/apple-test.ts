import { vol } from 'memfs';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import {
  formatArrayOfReactDelegateHandler,
  getSwiftModuleNames,
  resolveExtraBuildDependenciesAsync,
  resolveModuleAsync,
} from '../apple/apple';

afterEach(() => {
  vol.reset();
  jest.resetAllMocks();
});

describe(formatArrayOfReactDelegateHandler, () => {
  it('should output empty array when no one specify `reactDelegateHandlers`', () => {
    const modules = [
      {
        packageName: 'expo-constants',
        packageVersion: '10.0.1',
        pods: [
          {
            podName: 'EXConstants',
            podspecDir: '/path/to/expo/packages/expo-constants/ios',
          },
        ],
        flags: { inhibit_warnings: false },
        modules: [],
        swiftModuleNames: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: [],
        debugOnly: false,
      },
    ];
    expect(formatArrayOfReactDelegateHandler(modules)).toBe(`[
    ]`);
  });

  it('should output array of `(packageName, handler)` tuple', () => {
    const modules = [
      {
        packageName: 'expo-constants',
        packageVersion: '10.0.1',
        pods: [
          {
            podName: 'EXConstants',
            podspecDir: '/path/to/expo/packages/expo-constants/ios',
          },
        ],
        flags: { inhibit_warnings: false },
        modules: [],
        swiftModuleNames: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: ['ConstantsReactDelegateHandler', 'ConstantsReactDelegateHandler2'],
        debugOnly: false,
      },
      {
        packageName: 'expo-device',
        packageVersion: '4.0.1',
        pods: [
          {
            podName: 'EXDevice',
            podspecDir: '/path/to/expo/packages/expo-device/ios',
          },
        ],
        flags: { inhibit_warnings: false },
        modules: [],
        swiftModuleNames: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: ['DeviceReactDelegateHandler'],
        debugOnly: false,
      },
    ];
    expect(formatArrayOfReactDelegateHandler(modules)).toBe(`[
      (packageName: "expo-constants", handler: ConstantsReactDelegateHandler.self),
      (packageName: "expo-constants", handler: ConstantsReactDelegateHandler2.self),
      (packageName: "expo-device", handler: DeviceReactDelegateHandler.self)
    ]`);
  });
});

describe(getSwiftModuleNames, () => {
  it('should use value from module config when it exists', () => {
    const pods = [{ podName: 'expotest', podspecDir: '/path/to/pod' }];
    expect(getSwiftModuleNames(pods, ['EXTest'])).toEqual(['EXTest']);
    expect(getSwiftModuleNames(pods, undefined)).toEqual(['expotest']);
  });

  it('should replace non-alphanumeric values with _', () => {
    const pods = [{ podName: 'expo-test.2', podspecDir: '/path/to/pod' }];
    expect(getSwiftModuleNames(pods, undefined)).toEqual(['expo_test_2']);
  });
});

describe(resolveModuleAsync, () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const expoRoot = path.join(__dirname, '..', '..', '..', '..', '..');

  it('should resolve podspec in ios/ folder', async () => {
    const name = 'react-native-third-party';
    const podName = 'RNThirdParty';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON({ [`ios/${podName}.podspec`]: '' }, pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        name: '',
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['ios'] }),
      },
      {}
    );

    expect(result).toEqual({
      packageName: 'react-native-third-party',
      pods: [
        {
          podName: 'RNThirdParty',
          podspecDir: 'node_modules/react-native-third-party/ios',
        },
      ],
      swiftModuleNames: ['RNThirdParty'],
      flags: undefined,
      modules: [],
      appDelegateSubscribers: [],
      reactDelegateHandlers: [],
      debugOnly: false,
    });
  });

  it('should contain coreFeature field', async () => {
    const name = 'react-native-third-party';
    const podName = 'RNThirdParty';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON({ [`ios/${podName}.podspec`]: '' }, pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        name: '',
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['ios'], coreFeatures: ['swiftui'] }),
      },
      {}
    );
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      pods: [
        {
          podName: 'RNThirdParty',
          podspecDir: 'node_modules/react-native-third-party/ios',
        },
      ],
      swiftModuleNames: ['RNThirdParty'],
      flags: undefined,
      modules: [],
      appDelegateSubscribers: [],
      reactDelegateHandlers: [],
      debugOnly: false,
      coreFeatures: ['swiftui'],
    });
  });

  it('should resolve multiple podspecs', async () => {
    const name = 'react-native-third-party';
    const podName = 'RNThirdParty';
    const podName2 = 'RNThirdParty2';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON(
      {
        [`ios/${podName}.podspec`]: '',
        [`pod2/${podName2}.podspec`]: '',
      },
      pkgDir
    );

    const result = await resolveModuleAsync(
      name,
      {
        name: '',
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['ios'] }),
      },
      {}
    );
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      pods: [
        {
          podName: 'RNThirdParty',
          podspecDir: 'node_modules/react-native-third-party/ios',
        },
        {
          podName: 'RNThirdParty2',
          podspecDir: 'node_modules/react-native-third-party/pod2',
        },
      ],
      swiftModuleNames: ['RNThirdParty', 'RNThirdParty2'],
      flags: undefined,
      modules: [],
      appDelegateSubscribers: [],
      reactDelegateHandlers: [],
      debugOnly: false,
    });
  });
});

describe('resolveModuleAsync conditional podspecPath (autolinkWhen)', () => {
  const appRoot = '/app';
  const commandRoot = '/app/ios';

  const npmGatedConfig = () =>
    new ExpoModuleConfig({
      platforms: ['apple'],
      apple: {
        podspecPath: [
          './ExpoModulesCore.podspec',
          {
            path: './ExpoModulesWorkletsAdapter.podspec',
            autolinkWhen: { npmPackage: 'react-native-worklets' },
          },
        ],
      },
    });

  const resolveCore = (config: ExpoModuleConfig) =>
    resolveModuleAsync(
      'expo-modules-core',
      { name: '', path: '/app/node_modules/expo-modules-core', version: '0.0.1', config },
      { appRoot, commandRoot }
    );

  it('includes the conditional pod when the npm package is installed', async () => {
    vol.fromJSON(
      {
        'package.json': '{"name":"app"}',
        'node_modules/react-native-worklets/package.json': '{"name":"react-native-worklets"}',
      },
      appRoot
    );

    const result = await resolveCore(npmGatedConfig());
    expect(result?.pods.map((pod) => pod.podName)).toEqual([
      'ExpoModulesCore',
      'ExpoModulesWorkletsAdapter',
    ]);
  });

  it('omits the conditional pod when the npm package is not installed', async () => {
    vol.fromJSON({ 'package.json': '{"name":"app"}' }, appRoot);

    const result = await resolveCore(npmGatedConfig());
    expect(result?.pods.map((pod) => pod.podName)).toEqual(['ExpoModulesCore']);
  });

  const propertyGatedConfig = () =>
    new ExpoModuleConfig({
      platforms: ['apple'],
      apple: {
        podspecPath: [
          'ios/ExpoCamera.podspec',
          {
            path: 'ios/ExpoCameraBarcodeScanning.podspec',
            autolinkWhen: {
              podfileProperty: 'expo.camera.barcode-scanner-enabled',
              disabledValue: 'false',
            },
          },
        ],
      },
    });

  const resolveCamera = (config: ExpoModuleConfig) =>
    resolveModuleAsync(
      'expo-camera',
      { name: '', path: '/app/node_modules/expo-camera', version: '0.0.1', config },
      { appRoot, commandRoot }
    );

  it('omits the conditional pod when the Podfile property is the disabled value', async () => {
    vol.fromJSON(
      {
        'Podfile.properties.json': JSON.stringify({
          'expo.camera.barcode-scanner-enabled': 'false',
        }),
      },
      commandRoot
    );

    const result = await resolveCamera(propertyGatedConfig());
    expect(result?.pods.map((pod) => pod.podName)).toEqual(['ExpoCamera']);
  });

  it('includes the conditional pod when the Podfile property is not disabled', async () => {
    vol.fromJSON({ 'Podfile.properties.json': JSON.stringify({}) }, commandRoot);

    const result = await resolveCamera(propertyGatedConfig());
    expect(result?.pods.map((pod) => pod.podName)).toEqual([
      'ExpoCamera',
      'ExpoCameraBarcodeScanning',
    ]);
  });
});

describe(resolveExtraBuildDependenciesAsync, () => {
  it('should resolve extra build dependencies from Podfile.properties.json', async () => {
    vol.fromJSON(
      { 'Podfile.properties.json': `{"apple.extraPods": "[{\\"name\\":\\"test\\"}]"}` },
      '/app/ios'
    );

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/ios');
    expect(extraBuildDeps).toEqual([{ name: 'test' }]);
  });

  it('should return null for invalid JSON', async () => {
    vol.fromJSON({ 'Podfile.properties.json': `{"apple.extraPods": [{ name }]}` }, '/app/ios');

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/ios');
    expect(extraBuildDeps).toBe(null);
  });

  it('should return null if it does not contain any known properties', async () => {
    vol.fromJSON({ 'Podfile.properties.json': '' }, '/app/ios');

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/ios');
    expect(extraBuildDeps).toBe(null);
  });

  it('should return null if Podfile.properties.json not found', async () => {
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/macos');
    expect(extraBuildDeps).toBe(null);
  });
});
