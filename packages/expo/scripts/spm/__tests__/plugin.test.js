'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../cli', () => ({
  resolveExpoModules: jest.fn(),
  prebuiltMetadata: jest.fn(() => ({})),
  generateModulesProvider: jest.fn(() => null),
  runDumpPackage: jest.fn(),
}));
jest.mock('../app-target', () => ({
  resolveAppTarget: jest.fn(() => ({
    targetName: null,
    entitlementPath: null,
    podfilePropertiesPath: null,
  })),
}));
jest.mock('../flavored-frameworks', () => ({
  resolveFlavoredFramework: jest.fn(({ frameworkName }) =>
    frameworkName === 'ExpoModulesCore' ? { id: 'ExpoModulesCore', name: 'ExpoModulesCore' } : null
  ),
  prepareCompileInterfaces: jest.fn(() => '/abs/interfaces'),
}));

const { resolveExpoModules, prebuiltMetadata, generateModulesProvider, runDumpPackage } = require('../cli');
const { resolveAppTarget } = require('../app-target');
const { UnsupportedModulesError } = require('../diagnostics');
const { resolveFlavoredFramework } = require('../flavored-frameworks');
const expoSpmPlugin = require('../plugin');

const spec = (...body) => ['Pod::Spec.new do |s|', ...body, 'end', ''].join('\n');

function pureSwiftModule(root, podName, podspec) {
  const podspecDir = path.join(root, 'ios');
  fs.mkdirSync(podspecDir, { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"module"}');
  fs.writeFileSync(path.join(podspecDir, 'A.swift'), '// swift\n');
  fs.writeFileSync(path.join(podspecDir, `${podName}.podspec`), podspec);
  return podspecDir;
}

/** A module SwiftPM cannot build from source: ObjC++ sources and no manifest. */
function mixedModule(root, podName) {
  const podspecDir = path.join(root, 'ios');
  fs.mkdirSync(podspecDir, { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"module"}');
  fs.writeFileSync(path.join(podspecDir, `${podName}.mm`), '// objc++\n');
  fs.writeFileSync(path.join(podspecDir, `${podName}.podspec`), spec());
  return podspecDir;
}

/** Returns the module-level mocks to the defaults every describe starts from. */
function restoreModuleMocks() {
  prebuiltMetadata.mockReturnValue({});
  generateModulesProvider.mockReset();
  generateModulesProvider.mockReturnValue(null);
  resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
    frameworkName === 'ExpoModulesCore' ? { id: 'ExpoModulesCore', name: 'ExpoModulesCore' } : null
  );
}

describe('the pure-Swift branch', () => {
  let logs;
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-plugin-'));
    outDir = path.join(tmp, 'out');
    const dirs = {
      core: pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec()),
      good: pureSwiftModule(
        path.join(tmp, 'expo-asset'),
        'ExpoAsset',
        spec("  s.platforms = { :ios => '16.4' }")
      ),
      linked: pureSwiftModule(
        path.join(tmp, 'expo-media-library'),
        'ExpoMediaLibrary',
        spec("  s.platforms = { :ios => '16.4' }", "  s.frameworks = 'Photos', 'PhotosUI'")
      ),
      // podspecDir is the module root here: the podspec still lives in ios/.
      rootPodspecDir: path.join(tmp, 'expo-localization'),
      xcconfig: pureSwiftModule(
        path.join(tmp, 'expo-screen-capture'),
        'ExpoScreenCapture',
        spec(
          "  s.platforms = { :ios => '16.4' }",
          '  s.pod_target_xcconfig = {',
          "    'OTHER_LDFLAGS' => '$(inherited) -lc++'",
          '  }'
        )
      ),
    };
    pureSwiftModule(
      path.join(tmp, 'expo-localization'),
      'ExpoLocalization',
      spec("  s.platforms = { :ios => '16.4' }")
    );
    resolveExpoModules.mockReturnValue([
      {
        packageName: 'expo-modules-core',
        pods: [{ podName: 'ExpoModulesCore', podspecDir: dirs.core }],
      },
      { packageName: 'expo-asset', pods: [{ podName: 'ExpoAsset', podspecDir: dirs.good }] },
      {
        packageName: 'expo-media-library',
        pods: [{ podName: 'ExpoMediaLibrary', podspecDir: dirs.linked }],
      },
      {
        packageName: 'expo-screen-capture',
        pods: [{ podName: 'ExpoScreenCapture', podspecDir: dirs.xcconfig }],
      },
      {
        packageName: 'expo-localization',
        pods: [{ podName: 'ExpoLocalization', podspecDir: dirs.rootPodspecDir }],
      },
    ]);
    logs = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    try {
      expoSpmPlugin({
        react: null,
        outputDir: outDir,
        appRoot: path.join(tmp, 'app', 'ios'),
        projectRoot: path.join(tmp, 'app'),
      });
      thrown = null;
    } catch (error) {
      thrown = error;
    }
  });

  afterAll(() => Object.values(logs).forEach((spy) => spy.mockRestore()));

  it('fails the sync for a module whose linkage only its podspec declares', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'needs-manifest-for-linkage',
        podName: 'ExpoMediaLibrary',
        line: 3,
        snippet: "s.frameworks = 'Photos', 'PhotosUI'",
      }),
    ]);
    const report = logs.error.mock.calls.map(([text]) => text).join('\n');
    expect(report).toContain('ExpoMediaLibrary.podspec:3');
    expect(report).toContain('linkerSettings');
  });

  it('emits no package for it, while the modules around it still render', () => {
    const emitted = (product) => path.join(outDir, 'expo', 'expo-source', product, 'Package.swift');
    expect(fs.existsSync(emitted('ExpoMediaLibrary'))).toBe(false);
    expect(fs.readFileSync(emitted('ExpoAsset'), 'utf8')).toContain('platforms: [.iOS("16.4")],');
  });

  it('finds the podspec under ios/ when the pod points at the module root', () => {
    expect(
      fs.readFileSync(
        path.join(outDir, 'expo', 'expo-source', 'ExpoLocalization', 'Package.swift'),
        'utf8'
      )
    ).toContain('platforms: [.iOS("16.4")],');
  });

  it('emits a module that links through its xcconfig, and warns about the flags', () => {
    const report = logs.warn.mock.calls.map(([text]) => text).join('\n');
    expect(report).toContain('warning: Expo module "expo-screen-capture"');
    expect(report).toContain('ExpoScreenCapture.podspec:4');
    expect(report).toContain('-lc++');
    expect(
      fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoScreenCapture', 'Package.swift'))
    ).toBe(true);
  });
});

describe('the module registry', () => {
  let logs;
  let outDir;
  let appIosDir;

  const run = () =>
    expoSpmPlugin({
      react: null,
      outputDir: outDir,
      appRoot: appIosDir,
      projectRoot: path.dirname(appIosDir),
    });

  const writesProvider = (body) => () => {
    const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
    fs.mkdirSync(path.dirname(providerPath), { recursive: true });
    fs.writeFileSync(providerPath, body);
    return providerPath;
  };

  beforeEach(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-provider-'));
    outDir = path.join(tmp, 'out');
    appIosDir = path.join(tmp, 'app', 'ios');
    // ExpoModulesCore is the only pod the framework resolver mock covers, so it
    // is emitted as precompiled and nothing is left unsupported.
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    resolveExpoModules.mockReturnValue([
      {
        packageName: 'expo-modules-core',
        pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
      },
    ]);
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(writesProvider('ExpoModulesCore.self\n'));
    resolveAppTarget.mockReset();
    resolveAppTarget.mockReturnValue({
      targetName: null,
      entitlementPath: null,
      podfilePropertiesPath: null,
    });
    logs = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
  });

  afterEach(() => Object.values(logs).forEach((spy) => spy.mockRestore()));

  it('generates the provider for the app target that compiles it', () => {
    resolveAppTarget.mockReturnValue({
      targetName: 'minimalswiftpm',
      entitlementPath: '/app/ios/minimalswiftpm/minimalswiftpm.entitlements',
      podfilePropertiesPath: '/app/ios/Podfile.properties.json',
    });
    const result = run();

    expect(resolveAppTarget).toHaveBeenCalledWith(appIosDir);
    expect(generateModulesProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        appRoot: path.dirname(appIosDir),
        moduleNames: ['expo-modules-core'],
        targetName: 'minimalswiftpm',
        entitlementPath: '/app/ios/minimalswiftpm/minimalswiftpm.entitlements',
        podfilePropertiesPath: '/app/ios/Podfile.properties.json',
      })
    );
    expect(result.generatedSources).toEqual([
      { path: path.join(outDir, 'expo', 'ExpoModulesProvider.swift') },
    ]);
  });

  it('fails the sync when generation throws, instead of warning past it', () => {
    generateModulesProvider.mockImplementation(() => {
      throw new Error('expo-modules-autolinking exited with code 1');
    });

    expect(run).toThrow(/ExpoModulesProvider\.swift/);
    expect(run).toThrow(/expo-modules-autolinking exited with code 1/);
    expect(run).toThrow(/react-native spm/);
    expect(logs.warn.mock.calls.map(([text]) => text).join('\n')).not.toContain(
      'ExpoModulesProvider'
    );
  });

  it('fails the sync when generation writes no provider although modules resolved', () => {
    generateModulesProvider.mockReturnValue(null);

    expect(run).toThrow(/wrote no ExpoModulesProvider\.swift/);
    expect(run).toThrow(/1 Expo module/);
  });

  // The registry's other inputs: app groups come from the entitlements file,
  // inline-module registration from Podfile.properties.json.
  it('watches the entitlements and Podfile properties files it generated against', () => {
    resolveAppTarget.mockReturnValue({
      targetName: 'minimalswiftpm',
      entitlementPath: '/app/ios/minimalswiftpm/minimalswiftpm.entitlements',
      podfilePropertiesPath: '/app/ios/Podfile.properties.json',
    });

    const { watchPaths } = run();
    expect(watchPaths).toEqual(
      expect.arrayContaining([
        '/app/ios/minimalswiftpm/minimalswiftpm.entitlements',
        '/app/ios/Podfile.properties.json',
      ])
    );
    // RN resolves nothing for the plugin: a relative watch path would be read
    // against whichever directory the sync happens to run from.
    expect(watchPaths.every((watched) => path.isAbsolute(watched))).toBe(true);
  });

  it('watches no registry input the app does not have', () => {
    expect(run().watchPaths.every((watched) => path.isAbsolute(watched))).toBe(true);
  });

  // Excluding every Expo module is a legitimate configuration, not a failure.
  it('generates nothing, and fails nothing, when no modules are autolinked', () => {
    resolveExpoModules.mockReturnValue([]);
    generateModulesProvider.mockReturnValue(null);

    expect(run().generatedSources).toEqual([]);
  });

  // A regex heuristic over the generated Swift must never gate a build.
  it('only warns when the generated provider registers nothing', () => {
    generateModulesProvider.mockImplementation(writesProvider('// no modules\n'));

    expect(run).not.toThrow();
    expect(logs.warn.mock.calls.map(([text]) => text).join('\n')).toContain(
      'ExpoModulesProvider.swift is EMPTY'
    );
  });
});

// The metadata document (`expo-modules-autolinking prebuilt-metadata`) publishes
// the pod → npm package → product join. The plugin reads identity from it
// instead of re-deriving it from the filesystem.
describe('module identity from the prebuilt-metadata document', () => {
  let logs;
  let thrown;
  let dirs;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-identity-'));
    dirs = {
      core: pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec()),
      // The podspec sits outside the npm package, so only the document knows its root.
      skiaPodspecs: path.join(tmp, 'podspecs', 'skia'),
      skiaPackage: path.join(tmp, 'node_modules', '@shopify', 'react-native-skia'),
      adapter: mixedModule(path.join(tmp, 'expo-worklets-adapter'), 'ExpoModulesWorkletsAdapter'),
      legacy: mixedModule(path.join(tmp, 'expo-legacy'), 'ExpoLegacy'),
      stale: mixedModule(path.join(tmp, 'expo-stale'), 'ExpoStale'),
      vanished: path.join(tmp, 'vanished'),
    };
    fs.mkdirSync(dirs.skiaPodspecs, { recursive: true });
    fs.writeFileSync(path.join(dirs.skiaPodspecs, 'react-native-skia.podspec'), spec());
    mixedModule(dirs.skiaPackage, 'RNSkia');

    resolveExpoModules.mockReturnValue([
      {
        packageName: 'expo-modules-core',
        pods: [{ podName: 'ExpoModulesCore', podspecDir: dirs.core }],
      },
      {
        packageName: '@shopify/react-native-skia',
        pods: [{ podName: 'react-native-skia', podspecDir: dirs.skiaPodspecs }],
      },
      {
        packageName: 'expo-worklets-adapter',
        pods: [{ podName: 'ExpoModulesWorkletsAdapter', podspecDir: dirs.adapter }],
      },
      { packageName: 'expo-legacy', pods: [{ podName: 'ExpoLegacy', podspecDir: dirs.legacy }] },
      { packageName: 'expo-stale', pods: [{ podName: 'ExpoStale', podspecDir: dirs.stale }] },
    ]);
    prebuiltMetadata.mockReturnValue({
      'react-native-skia': {
        type: 'external',
        npmPackage: '@shopify/react-native-skia',
        packageRoot: dirs.skiaPackage,
        podspecDir: dirs.skiaPackage,
        productName: 'RNSkia',
      },
      ExpoModulesWorkletsAdapter: {
        type: 'internal',
        npmPackage: 'expo-worklets-adapter',
        packageRoot: path.dirname(dirs.adapter),
        podspecDir: dirs.adapter,
        productName: 'ExpoModulesWorkletsAdapter',
        sourceOnly: true,
      },
      ExpoStale: {
        type: 'internal',
        npmPackage: 'expo-stale',
        packageRoot: dirs.vanished,
        podspecDir: dirs.vanished,
        productName: 'ExpoStale',
      },
    });
    resolveFlavoredFramework.mockClear();
    logs = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    try {
      expoSpmPlugin({
        react: null,
        outputDir: path.join(tmp, 'out'),
        appRoot: path.join(tmp, 'app', 'ios'),
        projectRoot: path.join(tmp, 'app'),
      });
      thrown = null;
    } catch (error) {
      thrown = error;
    }
  });

  afterAll(() => {
    Object.values(logs).forEach((spy) => spy.mockRestore());
    restoreModuleMocks();
  });

  const resolvedFor = (packageName) =>
    resolveFlavoredFramework.mock.calls
      .map(([args]) => args)
      .find((args) => args.packageName === packageName);

  // The artifact is named after the PRODUCT: react-native-skia ships RNSkia.xcframework.
  it('looks the xcframework up under the product name, not the pod name', () => {
    expect(resolvedFor('@shopify/react-native-skia')).toMatchObject({ frameworkName: 'RNSkia' });
  });

  it('takes the module root from the document', () => {
    expect(resolvedFor('@shopify/react-native-skia')).toMatchObject({
      moduleRoot: dirs.skiaPackage,
    });
  });

  it('falls back to the nearest package.json for a pod the document does not cover', () => {
    expect(resolvedFor('expo-legacy')).toMatchObject({
      frameworkName: 'ExpoLegacy',
      moduleRoot: path.dirname(dirs.legacy),
    });
  });

  // A document entry pointing at a directory that is gone is not identity.
  it('falls back when the documented package root does not exist', () => {
    expect(resolvedFor('expo-stale')).toMatchObject({ moduleRoot: path.dirname(dirs.stale) });
  });

  it('reports a documented product as prebuildable, against the documented root', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toContainEqual(
      expect.objectContaining({
        reason: 'prebuild-available',
        podName: 'react-native-skia',
        productName: 'RNSkia',
        moduleRoot: dirs.skiaPackage,
      })
    );
  });

  // A source-only product never becomes an artifact, so it is no prebuild remedy.
  it('does not offer a prebuild for a source-only product', () => {
    expect(thrown.unsupported).toContainEqual(
      expect.objectContaining({
        reason: 'mixed-no-manifest',
        podName: 'ExpoModulesWorkletsAdapter',
        productName: 'ExpoModulesWorkletsAdapter',
      })
    );
  });

  it('offers no product for a pod the document does not cover', () => {
    expect(thrown.unsupported).toContainEqual(
      expect.objectContaining({
        reason: 'mixed-no-manifest',
        podName: 'ExpoLegacy',
        productName: null,
      })
    );
  });
});

describe('the watched module roots', () => {
  let logs;
  let watchPaths;
  let packageRoot;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-watch-'));
    const outDir = path.join(tmp, 'out');
    const podspecDir = pureSwiftModule(path.join(tmp, 'podspecs'), 'ExpoModulesCore', spec());
    packageRoot = path.join(tmp, 'node_modules', 'expo-modules-core');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), '{"name":"expo-modules-core"}');
    fs.writeFileSync(path.join(packageRoot, 'expo-module.config.json'), '{}');
    resolveExpoModules.mockReturnValue([
      { packageName: 'expo-modules-core', pods: [{ podName: 'ExpoModulesCore', podspecDir }] },
    ]);
    prebuiltMetadata.mockReturnValue({
      ExpoModulesCore: {
        type: 'internal',
        npmPackage: 'expo-modules-core',
        packageRoot,
        podspecDir,
        productName: 'ExpoModulesCore',
      },
    });
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(() => {
      const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
      fs.mkdirSync(path.dirname(providerPath), { recursive: true });
      fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
      return providerPath;
    });
    logs = {
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    ({ watchPaths } = expoSpmPlugin({
      react: null,
      outputDir: outDir,
      appRoot: path.join(tmp, 'app', 'ios'),
      projectRoot: path.join(tmp, 'app'),
    }));
  });

  afterAll(() => {
    Object.values(logs).forEach((spy) => spy.mockRestore());
    restoreModuleMocks();
  });

  it('watches the staleness inputs under the documented package root', () => {
    expect(watchPaths).toContain(path.join(packageRoot, 'expo-module.config.json'));
  });
});

// The product name has to reach the artifact declaration, not just the resolver
// call: react-native-skia ships RNSkia.xcframework.
describe('a precompiled product whose name differs from its pod name', () => {
  let logs;
  let result;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-product-'));
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const skiaPodspecDir = path.join(tmp, 'podspecs', 'skia');
    const skiaPackage = path.join(tmp, 'node_modules', '@shopify', 'react-native-skia');
    fs.mkdirSync(skiaPodspecDir, { recursive: true });
    fs.writeFileSync(path.join(skiaPodspecDir, 'react-native-skia.podspec'), spec());
    mixedModule(skiaPackage, 'RNSkia');

    resolveExpoModules.mockReturnValue([
      {
        packageName: 'expo-modules-core',
        pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
      },
      {
        packageName: '@shopify/react-native-skia',
        pods: [{ podName: 'react-native-skia', podspecDir: skiaPodspecDir }],
      },
    ]);
    prebuiltMetadata.mockReturnValue({
      'react-native-skia': {
        type: 'external',
        npmPackage: '@shopify/react-native-skia',
        packageRoot: skiaPackage,
        podspecDir: skiaPackage,
        productName: 'RNSkia',
      },
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'RNSkia'
        ? { id: frameworkName.toLowerCase(), frameworkName }
        : null
    );
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(() => {
      const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
      fs.mkdirSync(path.dirname(providerPath), { recursive: true });
      fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
      return providerPath;
    });
    logs = {
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    result = expoSpmPlugin({
      react: null,
      outputDir: outDir,
      appRoot: path.join(tmp, 'app', 'ios'),
      projectRoot: path.join(tmp, 'app'),
    });
  });

  afterAll(() => {
    Object.values(logs).forEach((spy) => spy.mockRestore());
    restoreModuleMocks();
  });

  it('declares the framework under the product name', () => {
    expect(result.flavoredFrameworks.map((f) => f.frameworkName)).toEqual([
      'ExpoModulesCore',
      'RNSkia',
    ]);
  });
});

describe('the source-emit pass', () => {
  let logs;
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-source-root-'));
    outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    // The Swift sources live in the npm package; the pod points elsewhere, so
    // only the document leads to a root the emit can work from.
    const packageRoot = path.join(tmp, 'node_modules', 'expo-remote');
    pureSwiftModule(packageRoot, 'ExpoRemote', spec("  s.platforms = { :ios => '16.4' }"));
    const podspecDir = path.join(tmp, 'podspecs', 'remote');
    fs.mkdirSync(podspecDir, { recursive: true });
    fs.writeFileSync(
      path.join(podspecDir, 'ExpoRemote.podspec'),
      spec("  s.platforms = { :ios => '16.4' }")
    );

    resolveExpoModules.mockReturnValue([
      {
        packageName: 'expo-modules-core',
        pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
      },
      { packageName: 'expo-remote', pods: [{ podName: 'ExpoRemote', podspecDir }] },
    ]);
    prebuiltMetadata.mockReturnValue({
      ExpoRemote: {
        type: 'internal',
        npmPackage: 'expo-remote',
        packageRoot,
        podspecDir,
        productName: 'ExpoRemote',
      },
    });
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(() => {
      const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
      fs.mkdirSync(path.dirname(providerPath), { recursive: true });
      fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
      return providerPath;
    });
    logs = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    try {
      expoSpmPlugin({
        react: null,
        outputDir: outDir,
        appRoot: path.join(tmp, 'app', 'ios'),
        projectRoot: path.join(tmp, 'app'),
      });
      thrown = null;
    } catch (error) {
      thrown = error;
    }
  });

  afterAll(() => {
    Object.values(logs).forEach((spy) => spy.mockRestore());
    restoreModuleMocks();
  });

  it('emits the pure-Swift package found at the documented root', () => {
    expect(thrown).toBeNull();
    expect(
      fs.readFileSync(
        path.join(outDir, 'expo', 'expo-source', 'ExpoRemote', 'Package.swift'),
        'utf8'
      )
    ).toContain('platforms: [.iOS("16.4")],');
  });
});

// CocoaPods raises every Expo module to ExpoModulesCore's deployment floor, and
// the document is where that floor comes from now — the podspec reader is only
// the fallback for a module whose config has not landed yet.
describe('the iOS deployment floor', () => {
  let logs;
  let outDir;
  let thrown;

  const entry = (packageRoot, podspecDir, productName, iosDeploymentTarget) => ({
    type: 'internal',
    npmPackage: productName,
    packageRoot,
    podspecDir,
    productName,
    iosDeploymentTarget,
  });

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-floor-'));
    outDir = path.join(tmp, 'out');
    const roots = {
      core: path.join(tmp, 'expo-modules-core'),
      low: path.join(tmp, 'expo-low'),
      high: path.join(tmp, 'expo-high'),
      // Its podspec disagrees with the document, so the winner is observable.
      disagreeing: path.join(tmp, 'expo-disagreeing'),
    };
    const dirs = {
      core: pureSwiftModule(
        roots.core,
        'ExpoModulesCore',
        spec("  s.platforms = { :ios => '16.4' }")
      ),
      low: pureSwiftModule(roots.low, 'ExpoLow', spec("  s.platforms = { :ios => '15.0' }")),
      high: pureSwiftModule(roots.high, 'ExpoHigh', spec("  s.platforms = { :ios => '17.0' }")),
      disagreeing: pureSwiftModule(
        roots.disagreeing,
        'ExpoDisagreeing',
        spec("  s.platforms = { :ios => '18.0' }")
      ),
    };
    resolveExpoModules.mockReturnValue([
      {
        packageName: 'expo-modules-core',
        pods: [{ podName: 'ExpoModulesCore', podspecDir: dirs.core }],
      },
      { packageName: 'expo-low', pods: [{ podName: 'ExpoLow', podspecDir: dirs.low }] },
      { packageName: 'expo-high', pods: [{ podName: 'ExpoHigh', podspecDir: dirs.high }] },
      {
        packageName: 'expo-disagreeing',
        pods: [{ podName: 'ExpoDisagreeing', podspecDir: dirs.disagreeing }],
      },
    ]);
    prebuiltMetadata.mockReturnValue({
      ExpoModulesCore: entry(roots.core, dirs.core, 'ExpoModulesCore', '16.4'),
      ExpoLow: entry(roots.low, dirs.low, 'ExpoLow', '15.0'),
      ExpoHigh: entry(roots.high, dirs.high, 'ExpoHigh', '17.0'),
      ExpoDisagreeing: entry(roots.disagreeing, dirs.disagreeing, 'ExpoDisagreeing', '17.5'),
    });
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(() => {
      const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
      fs.mkdirSync(path.dirname(providerPath), { recursive: true });
      fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
      return providerPath;
    });
    logs = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    try {
      expoSpmPlugin({
        react: null,
        outputDir: outDir,
        appRoot: path.join(tmp, 'app', 'ios'),
        projectRoot: path.join(tmp, 'app'),
      });
      thrown = null;
    } catch (error) {
      thrown = error;
    }
  });

  afterAll(() => {
    Object.values(logs).forEach((spy) => spy.mockRestore());
    restoreModuleMocks();
  });

  const emitted = (product) =>
    fs.readFileSync(path.join(outDir, 'expo', 'expo-source', product, 'Package.swift'), 'utf8');

  it('raises a module declaring less than ExpoModulesCore to the core floor', () => {
    expect(thrown).toBeNull();
    expect(emitted('ExpoLow')).toContain('platforms: [.iOS("16.4")],');
  });

  it('leaves a module declaring more than ExpoModulesCore alone', () => {
    expect(emitted('ExpoHigh')).toContain('platforms: [.iOS("17.0")],');
  });

  // 17.5 is neither the podspec's 18.0 nor the core floor, so only the document
  // can be its source.
  it('takes the floor from the document, not from the podspec', () => {
    expect(emitted('ExpoDisagreeing')).toContain('platforms: [.iOS("17.5")],');
  });
});

describe('the checked-in manifest branch', () => {
  let logs;
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-plugin-manifest-'));
    outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const vendored = path.join(tmp, 'expo-vendored');
    const vendoredPodspecDir = pureSwiftModule(vendored, 'ExpoVendored', spec());
    fs.writeFileSync(
      path.join(vendored, 'Package.swift'),
      '// swift-tools-version: 6.0\n// checked in by the module\n'
    );
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'ExpoVendored',
        products: [
          { name: 'ExpoVendored', type: { library: ['automatic'] }, targets: ['ExpoVendored'] },
        ],
        targets: [
          {
            name: 'ExpoVendored',
            type: 'regular',
            path: 'ios',
            dependencies: [{ byName: ['VendoredKit', null] }],
          },
          { name: 'VendoredKit', type: 'binary', path: 'ios/VendoredKit.xcframework' },
        ],
      })
    );
    resolveExpoModules.mockReturnValue([
      { packageName: 'expo-modules-core', pods: [{ podName: 'ExpoModulesCore', podspecDir: core }] },
      {
        packageName: 'expo-vendored',
        pods: [{ podName: 'ExpoVendored', podspecDir: vendoredPodspecDir }],
      },
    ]);
    logs = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    try {
      expoSpmPlugin({
        react: null,
        outputDir: outDir,
        appRoot: path.join(tmp, 'app', 'ios'),
        projectRoot: path.join(tmp, 'app'),
      });
      thrown = null;
    } catch (error) {
      thrown = error;
    }
  });

  afterAll(() => Object.values(logs).forEach((spy) => spy.mockRestore()));

  it('fails the sync for a manifest depending on a target it cannot declare', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'unsupported-target-dependency',
        podName: 'ExpoVendored',
        dependencies: [{ target: 'ExpoVendored', dependsOn: 'VendoredKit', kind: 'binary' }],
      }),
    ]);
    expect(logs.error.mock.calls.map(([text]) => text).join('\n')).toContain(
      'target "ExpoVendored" depends on "VendoredKit", a binary target'
    );
  });

  it('emits no package for it', () => {
    expect(
      fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoVendored', 'Package.swift'))
    ).toBe(false);
  });
});
