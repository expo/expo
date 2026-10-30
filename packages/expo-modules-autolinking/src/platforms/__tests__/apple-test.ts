import { vol } from 'memfs';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import * as iosInlineModules from '../../inlineModules/iosInlineModules';
import {
  formatArrayOfReactDelegateHandler,
  generateModulesProviderAsync,
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
      expect(await scanNativeModulesAsync(searchResults, 'ios')).toBeNull();
    } finally {
      Object.defineProperty(process, 'platform', descriptor);
    }
  });

  it('returns null when expo-modules-core is not among the packages', async () => {
    expect(await scanNativeModulesAsync({}, 'ios')).toBeNull();
  });

  it('returns null when the macros plugin cannot be resolved', async () => {
    // The plugin is resolved from the expo-modules-core path, which doesn't exist here.
    expect(await scanNativeModulesAsync(searchResults, 'ios')).toBeNull();
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

  it('should export local modules in the local package', async () => {
    const name = 'local-module';
    const pkgDir = path.join('modules', name);

    vol.fromJSON({ [`ios/LocalModule.podspec`]: '' }, pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        name,
        path: pkgDir,
        version: '',
        config: new ExpoModuleConfig({ platforms: ['ios'] }),
        isLocal: true,
      },
      {}
    );

    expect(result).toMatchObject({ packageName: 'local-module', exportedPackageName: '$local' });
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
    expect(result?.modulesFromScan).toBe(true);
  });

  it('uses scanned shared objects, unless the config declares the modules', async () => {
    const name = 'expo-clipboard';
    const pkgDir = path.join('node_modules', name);

    vol.fromJSON({ [`ios/ExpoClipboard.podspec`]: '' }, pkgDir);

    const extraOutput = {
      scannedModules: { [name]: [{ name: null, class: 'ClipboardModule' }] },
      scannedSharedObjects: { [name]: ['ClipboardItem', 'ClipboardHistory'] },
    };
    const revision = { name: '', path: pkgDir, version: '0.0.1' };

    const scanned = await resolveModuleAsync(
      name,
      { ...revision, config: new ExpoModuleConfig({ platforms: ['apple'] }) },
      extraOutput
    );
    expect(scanned?.sharedObjects).toEqual(['ClipboardHistory', 'ClipboardItem']);

    const declared = await resolveModuleAsync(
      name,
      {
        ...revision,
        config: new ExpoModuleConfig({ platforms: ['apple'], apple: { modules: [] } }),
      },
      extraOutput
    );
    expect(declared?.sharedObjects).toBeUndefined();
  });

  it('orders scanned modules by code unit, independent of the host locale', async () => {
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
            { name: null, class: 'bModule' },
            { name: null, class: 'aModule' },
            { name: null, class: 'BModule' },
          ],
        },
      }
    );

    expect(result?.modules?.map((module) => module.class)).toEqual([
      'BModule',
      'aModule',
      'bModule',
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
    expect(result?.modulesFromScan).toBeUndefined();
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

describe(generateModulesProviderAsync, () => {
  function descriptor(packageName: string, moduleClass: string, exportedPackageName?: string) {
    return {
      packageName,
      ...(exportedPackageName ? { exportedPackageName } : {}),
      pods: [],
      flags: undefined,
      swiftModuleNames: [],
      modules: [{ name: null, class: moduleClass }],
      modulesFromScan: true,
      appDelegateSubscribers: [],
      reactDelegateHandlers: [],
      debugOnly: false,
    };
  }

  it('lists modules declared with the macro in packages and the others in getModuleClasses()', async () => {
    const targetPath = '/app/ios/Pods/ExpoModulesProvider.swift';
    await generateModulesProviderAsync(
      [
        { ...descriptor('expo-camera', 'CameraModule'), modulesFromScan: false },
        descriptor('expo-audio', 'AudioModule'),
      ],
      targetPath,
      null,
      { watchedDirectories: [], inlineModulesTargets: { targets: [] }, targetPath, appRoot: '/app' }
    );

    const content = vol.readFileSync(targetPath, 'utf8') as string;
    const packages = content.slice(
      content.indexOf('override var packages'),
      content.indexOf('getModuleClasses()')
    );
    const moduleClasses = content.slice(
      content.indexOf('getModuleClasses()'),
      content.indexOf('getAppDelegateSubscribers()')
    );
    expect(moduleClasses).toContain('(module: CameraModule.self, name: nil)');
    expect(moduleClasses).not.toContain('AudioModule');
    expect(packages).toContain('"expo-audio": ExpoPackage(');
    expect(packages).not.toContain('CameraModule');
  });

  it('lists the local package first and the other packages sorted', async () => {
    const targetPath = '/app/ios/Pods/ExpoModulesProvider.swift';
    await generateModulesProviderAsync(
      [
        descriptor('expo-camera', 'CameraModule'),
        descriptor('my-local-module', 'MyLocalModule', '$local'),
        descriptor('@expo/ui', 'ExpoUIModule'),
      ],
      targetPath,
      null,
      { watchedDirectories: [], inlineModulesTargets: { targets: [] }, targetPath, appRoot: '/app' }
    );

    const content = vol.readFileSync(targetPath, 'utf8') as string;
    const keys = [...content.matchAll(/"([^"]+)": ExpoPackage\(/g)].map((match) => match[1]);
    expect(keys).toEqual(['$local', '@expo/ui', 'expo-camera']);
  });

  it('lists the debug-only packages only in the debug configuration', async () => {
    const targetPath = '/app/ios/Pods/ExpoModulesProvider.swift';
    await generateModulesProviderAsync(
      [
        descriptor('expo-camera', 'CameraModule'),
        { ...descriptor('expo-dev-tools', 'DevToolsModule'), debugOnly: true },
        { ...descriptor('expo-camera-dev', 'CameraDevModule'), debugOnly: true },
      ],
      targetPath,
      null,
      { watchedDirectories: [], inlineModulesTargets: { targets: [] }, targetPath, appRoot: '/app' }
    );

    const content = vol.readFileSync(targetPath, 'utf8') as string;
    const packages = content.slice(
      content.indexOf('override var packages'),
      content.indexOf('getModuleClasses()')
    );
    const [debugBlock, releaseBlock] = packages
      .slice(packages.indexOf('#if EXPO_CONFIGURATION_DEBUG'), packages.indexOf('#endif'))
      .split('#else');
    const keys = (block: string) =>
      [...block.matchAll(/"([^"]+)": ExpoPackage\(/g)].map((match) => match[1]);
    expect(keys(debugBlock!)).toEqual(['expo-camera', 'expo-camera-dev', 'expo-dev-tools']);
    expect(keys(releaseBlock!)).toEqual(['expo-camera']);
  });

  it('merges the inline modules declared with the macro into the local package', async () => {
    jest.spyOn(iosInlineModules, 'getIosInlineModulesClassNames').mockResolvedValue({
      modules: [{ class: 'InlineDslModule', name: null }],
      expoModules: [{ class: 'InlineExpoModule', name: null }],
    });
    const targetPath = '/app/ios/Pods/ExpoModulesProvider.swift';
    await generateModulesProviderAsync(
      [descriptor('my-local-module', 'MyLocalModule', '$local')],
      targetPath,
      null,
      {
        watchedDirectories: ['app'],
        inlineModulesTargets: { targets: ['App'] },
        targetPath,
        targetName: 'App',
        appRoot: '/app',
      }
    );

    const content = vol.readFileSync(targetPath, 'utf8') as string;
    const packages = content.slice(
      content.indexOf('override var packages'),
      content.indexOf('getModuleClasses()')
    );
    const moduleClasses = content.slice(
      content.indexOf('getModuleClasses()'),
      content.indexOf('getAppDelegateSubscribers()')
    );
    expect([...packages.matchAll(/"([^"]+)": ExpoPackage\(/g)]).toHaveLength(1);
    expect(packages).toContain('"$local": ExpoPackage(');
    expect(packages).toContain('modules: [MyLocalModule.self, InlineExpoModule.self]');
    expect(moduleClasses).toContain('(module: InlineDslModule.self, name: nil)');
    expect(moduleClasses).not.toContain('InlineExpoModule');
  });
});
