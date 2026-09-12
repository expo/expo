import { vol } from 'memfs';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import {
  formatArrayOfReactDelegateHandler,
  getSwiftModuleNames,
  resolveExtraBuildDependenciesAsync,
  resolveModuleAsync,
  scanNativeModulesAsync,
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

describe(scanNativeModulesAsync, () => {
  const searchResults = {
    'expo-modules-core': {
      name: 'expo-modules-core',
      path: '/nonexistent/node_modules/expo-modules-core',
      version: '3.0.0',
    },
  };

  it('returns null on a non-macOS host', async () => {
    // `process.platform` is a read-only accessor, so `jest.replaceProperty` can't restore it.
    const descriptor = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      expect(await scanNativeModulesAsync(searchResults)).toBeNull();
    } finally {
      Object.defineProperty(process, 'platform', descriptor);
    }
  });

  it('returns null when expo-modules-core is not among the packages', async () => {
    expect(await scanNativeModulesAsync({})).toBeNull();
  });

  it('returns null when the macros plugin cannot be resolved', async () => {
    // The plugin is resolved from the expo-modules-core path, which doesn't exist here.
    expect(await scanNativeModulesAsync(searchResults)).toBeNull();
  });
});

describe(resolveModuleAsync, () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

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

  it('uses scanned modules when the config declares none', async () => {
    const name = 'expo-clipboard';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON({ [`ios/ExpoClipboard.podspec`]: '' }, pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        name: '',
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['apple'] }),
      },
      {
        scannedModules: {
          [name]: [
            { name: null, class: 'ClipboardPasteButtonModule' },
            { name: null, class: 'ClipboardModule' },
          ],
        },
      }
    );

    expect(result?.modules).toEqual([
      { name: null, class: 'ClipboardModule' },
      { name: null, class: 'ClipboardPasteButtonModule' },
    ]);
  });

  it('ignores scanned modules when the config declares an empty list, as an opt-out', async () => {
    const name = 'expo-clipboard';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON({ [`ios/ExpoClipboard.podspec`]: '' }, pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        name: '',
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['apple'], apple: { modules: [] } }),
      },
      {
        scannedModules: {
          [name]: [{ name: null, class: 'ClipboardModule' }],
        },
      }
    );

    expect(result?.modules).toEqual([]);
  });

  it('ignores scanned modules when the config declares any, as an explicit override', async () => {
    const name = 'expo-clipboard';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON({ [`ios/ExpoClipboard.podspec`]: '' }, pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        name: '',
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({
          platforms: ['apple'],
          apple: { modules: ['ClipboardModule'] },
        }),
      },
      {
        scannedModules: {
          [name]: [
            { name: null, class: 'ClipboardModule' },
            { name: null, class: 'ClipboardPasteButtonModule' },
          ],
        },
      }
    );

    expect(result?.modules).toEqual([{ name: null, class: 'ClipboardModule' }]);
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
