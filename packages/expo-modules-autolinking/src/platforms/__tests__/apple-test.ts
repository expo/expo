import { vol } from 'memfs';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import * as iosInlineModules from '../../inlineModules/iosInlineModules';
import {
  coreSupportsPackages,
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

describe(coreSupportsPackages, () => {
  it('supports the minimum version and newer versions', () => {
    expect(coreSupportsPackages('58.0.30')).toBe(true);
    expect(coreSupportsPackages('58.0.31')).toBe(true);
    expect(coreSupportsPackages('58.1.0')).toBe(true);
    expect(coreSupportsPackages('59.0.0-canary-20261102-abcdef0')).toBe(true);
  });

  it('does not support older versions or a prerelease of the minimum version', () => {
    expect(coreSupportsPackages('58.0.29')).toBe(false);
    expect(coreSupportsPackages('57.9.99')).toBe(false);
    expect(coreSupportsPackages('58.0.30-canary-20261102-abcdef0')).toBe(false);
  });

  it('does not support a missing version or one that cannot be parsed', () => {
    expect(coreSupportsPackages(undefined)).toBe(false);
    expect(coreSupportsPackages(null)).toBe(false);
    expect(coreSupportsPackages('')).toBe(false);
    expect(coreSupportsPackages('latest')).toBe(false);
    expect(coreSupportsPackages('58.0')).toBe(false);
  });
});

describe(generateModulesProviderAsync, () => {
  const targetPath = '/app/ios/Pods/ExpoModulesProvider.swift';
  const params = {
    watchedDirectories: [],
    inlineModulesTargets: { targets: [] },
    targetPath,
    appRoot: '/app',
    coreVersion: '58.0.30',
  };

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

  function readProvider() {
    const content = vol.readFileSync(targetPath, 'utf8') as string;
    const hasPackages = content.includes('override var packages');
    return {
      content,
      packages: hasPackages
        ? content.slice(
            content.indexOf('override var packages'),
            content.indexOf('getModuleClasses()')
          )
        : null,
      moduleClasses: content.slice(
        content.indexOf('getModuleClasses()'),
        content.indexOf('getAppDelegateSubscribers()')
      ),
    };
  }

  function packageNames(source: string) {
    return [...source.matchAll(/"([^"]+)": ExpoPackage\(/g)].map((match) => match[1]);
  }

  it('lists all modules in getModuleClasses() and the scanned modules also in packages', async () => {
    await generateModulesProviderAsync(
      [
        { ...descriptor('expo-camera', 'CameraModule'), modulesFromScan: false },
        descriptor('expo-audio', 'AudioModule'),
      ],
      targetPath,
      null,
      params
    );

    const { packages, moduleClasses } = readProvider();
    expect(moduleClasses).toContain('(module: CameraModule.self, name: nil)');
    expect(moduleClasses).toContain('(module: AudioModule.self, name: nil)');
    expect(packages).toContain('"expo-audio": ExpoPackage(');
    expect(packages).not.toContain('CameraModule');
  });

  it('generates getModuleClasses() the same way with and without packages', async () => {
    const modules = [
      { ...descriptor('expo-camera', 'CameraModule'), modulesFromScan: false },
      descriptor('expo-audio', 'AudioModule'),
    ];
    await generateModulesProviderAsync(modules, targetPath, null, params);
    const withPackages = readProvider();
    vol.reset();
    await generateModulesProviderAsync(modules, targetPath, null, {
      ...params,
      coreVersion: '58.0.29',
    });
    const withoutPackages = readProvider();

    expect(withPackages.packages).not.toBeNull();
    expect(withoutPackages.packages).toBeNull();
    expect(withPackages.moduleClasses).toBe(withoutPackages.moduleClasses);
    expect(
      withPackages.content.replace(/  public override var packages[\s\S]*?\n  }\n\n/, '')
    ).toBe(withoutPackages.content);
  });

  it.each([['58.0.29'], ['58.0.30-canary-20261102-abcdef0'], [null], [undefined]])(
    'does not generate packages when the core version is %p',
    async (coreVersion) => {
      await generateModulesProviderAsync(
        [descriptor('expo-audio', 'AudioModule')],
        targetPath,
        null,
        { ...params, coreVersion }
      );

      const { content, moduleClasses } = readProvider();
      expect(content).not.toContain('ExpoPackage');
      expect(moduleClasses).toContain('(module: AudioModule.self, name: nil)');
    }
  );

  it('lists the local package first and the other packages sorted', async () => {
    await generateModulesProviderAsync(
      [
        descriptor('expo-camera', 'CameraModule'),
        descriptor('my-local-module', 'MyLocalModule', '$local'),
        descriptor('@expo/ui', 'ExpoUIModule'),
      ],
      targetPath,
      null,
      params
    );

    expect(packageNames(readProvider().packages!)).toEqual(['$local', '@expo/ui', 'expo-camera']);
  });

  it('lists the debug-only packages only in the debug configuration', async () => {
    await generateModulesProviderAsync(
      [
        descriptor('expo-camera', 'CameraModule'),
        { ...descriptor('expo-dev-tools', 'DevToolsModule'), debugOnly: true },
        { ...descriptor('expo-camera-dev', 'CameraDevModule'), debugOnly: true },
      ],
      targetPath,
      null,
      params
    );

    const packages = readProvider().packages!;
    const [debugBlock, releaseBlock] = packages
      .slice(packages.indexOf('#if EXPO_CONFIGURATION_DEBUG'), packages.indexOf('#endif'))
      .split('#else');
    expect(packageNames(debugBlock!)).toEqual(['expo-camera', 'expo-camera-dev', 'expo-dev-tools']);
    expect(packageNames(releaseBlock!)).toEqual(['expo-camera']);
  });

  it('merges the inline modules declared with the macro into the local package', async () => {
    jest.spyOn(iosInlineModules, 'getIosInlineModulesClassNames').mockResolvedValue({
      modules: [
        { class: 'InlineDslModule', name: null },
        { class: 'InlineExpoModule', name: null },
      ],
      expoModules: [{ class: 'InlineExpoModule', name: null }],
    });
    await generateModulesProviderAsync(
      [descriptor('my-local-module', 'MyLocalModule', '$local')],
      targetPath,
      null,
      {
        ...params,
        watchedDirectories: ['app'],
        inlineModulesTargets: { targets: ['App'] },
        targetName: 'App',
      }
    );

    const { packages, moduleClasses } = readProvider();
    expect(packageNames(packages!)).toEqual(['$local']);
    expect(packages).toContain('modules: [MyLocalModule.self, InlineExpoModule.self]');
    expect(moduleClasses).toContain('(module: InlineDslModule.self, name: nil)');
    expect(moduleClasses).toContain('(module: InlineExpoModule.self, name: nil)');
  });
});
