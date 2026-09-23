'use strict';

const fs = require('fs');
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
// Only what touches the filesystem is faked; the pure helpers stay real, so the
// plugin is tested against the ordering and the collision check it really applies.
jest.mock('../flavored-frameworks', () => ({
  ...jest.requireActual('../flavored-frameworks'),
  resolveFlavoredFramework: jest.fn(({ frameworkName }) =>
    frameworkName === 'ExpoModulesCore' ? { id: 'ExpoModulesCore', name: 'ExpoModulesCore' } : null
  ),
  resolveSpmDependencyFrameworks: jest.fn(() => []),
  prepareCompileInterfaces: jest.fn(() => '/abs/interfaces'),
}));
// The module-root walk stays real; it is spied on so a test can assert that a
// root React Native already resolved made the walk unnecessary.
jest.mock('../classify', () => {
  const actual = jest.requireActual('../classify');
  return { ...actual, findModuleRoot: jest.fn(actual.findModuleRoot) };
});

const {
  resolveExpoModules,
  prebuiltMetadata,
  generateModulesProvider,
  runDumpPackage,
} = require('../cli');
const { resolveAppTarget } = require('../app-target');
const { findModuleRoot } = require('../classify');
const { UnsupportedModulesError } = require('../diagnostics');
const {
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveSpmDependencyFrameworks,
} = require('../flavored-frameworks');
const {
  captureConsole,
  makeTempDir,
  metadataEntry,
  printed,
  removeTempDirs,
  runPlugin,
  spec,
  thrownBy,
} = require('./helpers');

afterAll(removeTempDirs);

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

/** A podspec outside any npm package: the module-root walk has nothing to find. */
function podspecOnly(tmp, podName) {
  const dir = path.join(tmp, 'podspecs', podName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${podName}.podspec`), spec());
  return dir;
}

/** Makes the registry generator write a non-empty provider under `outDir`. */
function providerWrittenTo(outDir) {
  generateModulesProvider.mockReset();
  generateModulesProvider.mockImplementation(() => {
    const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
    fs.mkdirSync(path.dirname(providerPath), { recursive: true });
    fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
    return providerPath;
  });
}

/** Returns the module-level mocks to the defaults every describe starts from. */
function restoreModuleMocks() {
  prebuiltMetadata.mockReturnValue({});
  generateModulesProvider.mockReset();
  generateModulesProvider.mockReturnValue(null);
  resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
    frameworkName === 'ExpoModulesCore' ? { id: 'ExpoModulesCore', name: 'ExpoModulesCore' } : null
  );
  resolveSpmDependencyFrameworks.mockReset();
  resolveSpmDependencyFrameworks.mockReturnValue([]);
  prepareCompileInterfaces.mockImplementation(() => '/abs/interfaces');
}

/** The arguments the framework resolver was called with for one package. */
const resolvedFor = (packageName) =>
  resolveFlavoredFramework.mock.calls
    .map(([args]) => args)
    .find((args) => args.packageName === packageName);

describe('the pure-Swift branch', () => {
  const logs = captureConsole();
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-plugin-');
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
      spec('  s.pod_target_xcconfig = {', "    'OTHER_LDFLAGS' => '$(inherited) -lc++'", '  }')
    );
    resolveExpoModules.mockReturnValue({
      modules: [
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
      ],
      extraDependencies: [],
    });
    thrown = thrownBy(() => runPlugin(tmp));
  });

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
    const report = printed(logs.error);
    expect(report).toContain('ExpoMediaLibrary.podspec:3');
    expect(report).toContain('linkerSettings');
  });

  it('emits no package for it, while the modules around it still render', () => {
    const emitted = (product) => path.join(outDir, 'expo', 'expo-source', product, 'Package.swift');
    expect(fs.existsSync(emitted('ExpoMediaLibrary'))).toBe(false);
    expect(fs.existsSync(emitted('ExpoAsset'))).toBe(true);
  });

  it('finds the podspec under ios/ when the pod points at the module root', () => {
    const report = printed(logs.warn);
    expect(report).toContain('ExpoLocalization.podspec:3');
    expect(
      fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoLocalization', 'Package.swift'))
    ).toBe(true);
  });

  it('emits a module that links through its xcconfig, and warns about the flags', () => {
    const report = printed(logs.warn);
    expect(report).toContain('warning: Expo module "expo-screen-capture"');
    expect(report).toContain('ExpoScreenCapture.podspec:4');
    expect(report).toContain('-lc++');
    expect(
      fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoScreenCapture', 'Package.swift'))
    ).toBe(true);
  });
});

describe('the module registry', () => {
  const logs = captureConsole({ each: true });
  let tmp;
  let outDir;
  let appIosDir;

  const run = () => runPlugin(tmp);

  const writesProvider = (body) => () => {
    const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
    fs.mkdirSync(path.dirname(providerPath), { recursive: true });
    fs.writeFileSync(providerPath, body);
    return providerPath;
  };

  beforeEach(() => {
    tmp = makeTempDir('expo-spm-provider-');
    outDir = path.join(tmp, 'out');
    appIosDir = path.join(tmp, 'app', 'ios');
    // ExpoModulesCore is the only pod the framework resolver mock covers, so it
    // is emitted as precompiled and nothing is left unsupported.
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
      ],
      extraDependencies: [],
    });
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(writesProvider('ExpoModulesCore.self\n'));
    resolveAppTarget.mockReset();
    resolveAppTarget.mockReturnValue({
      targetName: null,
      entitlementPath: null,
      podfilePropertiesPath: null,
    });
  });

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
    expect(printed(logs.warn)).not.toContain('ExpoModulesProvider');
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
    resolveExpoModules.mockReturnValue({
      modules: [],
      extraDependencies: [],
    });
    generateModulesProvider.mockReturnValue(null);

    expect(run().generatedSources).toEqual([]);
  });

  // A regex heuristic over the generated Swift must never gate a build.
  it('only warns when the generated provider registers nothing', () => {
    generateModulesProvider.mockImplementation(writesProvider('// no modules\n'));

    expect(run).not.toThrow();
    expect(printed(logs.warn)).toContain('ExpoModulesProvider.swift is EMPTY');
  });
});

// The metadata document (`expo-modules-autolinking prebuilt-metadata`) publishes
// the pod → npm package → product join. The plugin reads identity from it
// instead of re-deriving it from the filesystem.
describe('module identity from the prebuilt-metadata document', () => {
  captureConsole();
  let thrown;
  let dirs;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-identity-');
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

    resolveExpoModules.mockReturnValue({
      modules: [
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
      ],
      extraDependencies: [],
    });
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
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

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
  captureConsole();
  let watchPaths;
  let packageRoot;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-watch-');
    const outDir = path.join(tmp, 'out');
    const podspecDir = pureSwiftModule(path.join(tmp, 'podspecs'), 'ExpoModulesCore', spec());
    packageRoot = path.join(tmp, 'node_modules', 'expo-modules-core');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), '{"name":"expo-modules-core"}');
    fs.writeFileSync(path.join(packageRoot, 'expo-module.config.json'), '{}');
    resolveExpoModules.mockReturnValue({
      modules: [
        { packageName: 'expo-modules-core', pods: [{ podName: 'ExpoModulesCore', podspecDir }] },
      ],
      extraDependencies: [],
    });
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
    ({ watchPaths } = runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('watches the staleness inputs under the documented package root', () => {
    expect(watchPaths).toContain(path.join(packageRoot, 'expo-module.config.json'));
  });
});

// The product name has to reach the artifact declaration, not just the resolver
// call: react-native-skia ships RNSkia.xcframework.
describe('a precompiled product whose name differs from its pod name', () => {
  captureConsole();
  let result;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-product-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const skiaPodspecDir = path.join(tmp, 'podspecs', 'skia');
    const skiaPackage = path.join(tmp, 'node_modules', '@shopify', 'react-native-skia');
    fs.mkdirSync(skiaPodspecDir, { recursive: true });
    fs.writeFileSync(path.join(skiaPodspecDir, 'react-native-skia.podspec'), spec());
    mixedModule(skiaPackage, 'RNSkia');

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: '@shopify/react-native-skia',
          pods: [{ podName: 'react-native-skia', podspecDir: skiaPodspecDir }],
        },
      ],
      extraDependencies: [],
    });
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
    result = runPlugin(tmp);
  });

  afterAll(restoreModuleMocks);

  it('declares the framework under the product name', () => {
    expect(result.flavoredFrameworks.map((f) => f.frameworkName)).toEqual([
      'ExpoModulesCore',
      'RNSkia',
    ]);
  });
});

describe('the source-emit pass', () => {
  captureConsole();
  let outDir;
  let packageRoot;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-source-root-');
    outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    // The Swift sources live in the npm package; the pod points elsewhere, so
    // only the document leads to a root the emit can work from.
    packageRoot = path.join(tmp, 'node_modules', 'expo-remote');
    pureSwiftModule(packageRoot, 'ExpoRemote', spec("  s.platforms = { :ios => '16.4' }"));
    const podspecDir = path.join(tmp, 'podspecs', 'remote');
    fs.mkdirSync(podspecDir, { recursive: true });
    fs.writeFileSync(
      path.join(podspecDir, 'ExpoRemote.podspec'),
      spec("  s.platforms = { :ios => '16.4' }")
    );

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        { packageName: 'expo-remote', pods: [{ podName: 'ExpoRemote', podspecDir }] },
      ],
      extraDependencies: [],
    });
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
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('emits the pure-Swift package found at the documented root', () => {
    expect(thrown).toBeNull();
    const pkgDir = path.join(outDir, 'expo', 'expo-source', 'ExpoRemote');
    expect(fs.readFileSync(path.join(pkgDir, 'Package.swift'), 'utf8')).toContain(
      'name: "ExpoRemote"'
    );
    expect(fs.realpathSync(path.join(pkgDir, 'root'))).toBe(fs.realpathSync(packageRoot));
  });

  // Without this flag a module using @Field or @Record compiles to "external macro
  // implementation could not be found", which is the failure CocoaPods avoids in
  // `project_integrator.rb#integrate_core_macro_plugins`.
  it('hands the emitted package the Swift macro plugin', () => {
    const out = fs.readFileSync(
      path.join(outDir, 'expo', 'expo-source', 'ExpoRemote', 'Package.swift'),
      'utf8'
    );
    expect(out).toContain('"-Xfrontend", "-load-plugin-executable", "-Xfrontend"');
    expect(out).toMatch(/ExpoModulesMacros-tool#ExpoModulesMacros/);
  });
});

// CocoaPods raises every Expo module to ExpoModulesCore's deployment floor, and the
// prebuilt-metadata document is the only place that floor comes from.
describe('the iOS deployment floor', () => {
  captureConsole();
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-floor-');
    outDir = path.join(tmp, 'out');
    const roots = {
      core: path.join(tmp, 'expo-modules-core'),
      low: path.join(tmp, 'expo-low'),
      high: path.join(tmp, 'expo-high'),
      // Its podspec disagrees with the document, so the winner is observable.
      disagreeing: path.join(tmp, 'expo-disagreeing'),
      // Absent from the document entirely — the case a config-less package lands in.
      absent: path.join(tmp, 'expo-absent'),
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
      absent: pureSwiftModule(
        roots.absent,
        'ExpoAbsent',
        spec("  s.platforms = { :ios => '18.0' }")
      ),
    };
    resolveExpoModules.mockReturnValue({
      modules: [
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
        { packageName: 'expo-absent', pods: [{ podName: 'ExpoAbsent', podspecDir: dirs.absent }] },
      ],
      extraDependencies: [],
    });
    prebuiltMetadata.mockReturnValue({
      ExpoModulesCore: metadataEntry(roots.core, 'ExpoModulesCore', {
        iosDeploymentTarget: '16.4',
      }),
      ExpoLow: metadataEntry(roots.low, 'ExpoLow', { iosDeploymentTarget: '15.0' }),
      ExpoHigh: metadataEntry(roots.high, 'ExpoHigh', { iosDeploymentTarget: '17.0' }),
      ExpoDisagreeing: metadataEntry(roots.disagreeing, 'ExpoDisagreeing', {
        iosDeploymentTarget: '17.5',
      }),
    });
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(() => {
      const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
      fs.mkdirSync(path.dirname(providerPath), { recursive: true });
      fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
      return providerPath;
    });
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

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

  // Its podspec asks for 18.0 and gets 16.4: a module the document does not describe
  // has no floor of its own, so it lands on the core floor every module is raised to.
  it('gives a module the document omits the core floor, not its podspec floor', () => {
    expect(emitted('ExpoAbsent')).toContain('platforms: [.iOS("16.4")],');
  });
});

// A precompiled module links its SwiftPM packages (SDWebImage, ZXingObjC, …) as
// separate XCFrameworks. RN takes them in the same flat array as the modules.
describe('the SwiftPM packages a precompiled module links', () => {
  const logs = captureConsole();
  let result;
  let roots;
  let compiled;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-deps-plugin-');
    const outDir = path.join(tmp, 'out');
    roots = { core: path.join(tmp, 'expo-modules-core'), image: path.join(tmp, 'expo-image') };
    const core = pureSwiftModule(roots.core, 'ExpoModulesCore', spec());
    const imagePodspecDir = mixedModule(roots.image, 'ExpoImage');
    fs.writeFileSync(
      path.join(imagePodspecDir, 'ExpoImage.podspec'),
      spec(
        "  s.dependency 'ExpoModulesCore'",
        "  s.dependency 'SDWebImage'",
        "  s.dependency 'libavif/libdav1d'",
        "  s.dependency 'SomeUnmappedPod'"
      )
    );

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: 'expo-image',
          pods: [{ podName: 'ExpoImage', podspecDir: imagePodspecDir }],
        },
      ],
      extraDependencies: [],
    });
    prebuiltMetadata.mockReturnValue({
      ExpoImage: {
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: roots.image,
        podspecDir: imagePodspecDir,
        productName: 'ExpoImage',
        spmDependencies: ['SDWebImage', 'libavif'],
      },
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'ExpoImage'
        ? { id: frameworkName === 'ExpoImage' ? 'expo-image' : 'expo-modules-core', frameworkName }
        : null
    );
    resolveSpmDependencyFrameworks.mockReturnValue([
      { id: 'expo-sdweb-image', frameworkName: 'SDWebImage' },
      { id: 'expo-libavif', frameworkName: 'libavif' },
    ]);
    generateModulesProvider.mockReset();
    generateModulesProvider.mockImplementation(() => {
      const providerPath = path.join(outDir, 'expo', 'ExpoModulesProvider.swift');
      fs.mkdirSync(path.dirname(providerPath), { recursive: true });
      fs.writeFileSync(providerPath, 'ExpoModulesCore.self\n');
      return providerPath;
    });
    // Snapshotted at call time: the plugin hands the builder the same array it
    // returns, so reading the retained argument afterwards would prove nothing
    // about what the builder was given.
    prepareCompileInterfaces.mockImplementation((frameworks) => {
      compiled = frameworks.map((framework) => framework.frameworkName);
      return '/abs/interfaces';
    });
    result = runPlugin(tmp);
  });

  afterAll(restoreModuleMocks);

  it('resolves them from the precompiled pods that declare them', () => {
    expect(resolveSpmDependencyFrameworks).toHaveBeenCalledWith([
      expect.objectContaining({
        podName: 'ExpoModulesCore',
        moduleRoot: roots.core,
        spmDependencies: undefined,
      }),
      expect.objectContaining({
        podName: 'ExpoImage',
        moduleRoot: roots.image,
        spmDependencies: ['SDWebImage', 'libavif'],
      }),
    ]);
  });

  it('declares each one beside the modules, exactly once', () => {
    expect(result.flavoredFrameworks).toEqual([
      { id: 'expo-image', frameworkName: 'ExpoImage' },
      { id: 'expo-libavif', frameworkName: 'libavif' },
      { id: 'expo-modules-core', frameworkName: 'ExpoModulesCore' },
      { id: 'expo-sdweb-image', frameworkName: 'SDWebImage' },
    ]);
  });

  it('compiles their headers into the interface tree', () => {
    expect(compiled).toEqual(['ExpoImage', 'libavif', 'ExpoModulesCore', 'SDWebImage']);
  });

  it('warns about the pods a precompiled module depends on that nothing provides', () => {
    const report = printed(logs.warn);
    expect(report).toContain('warning: Expo module "expo-image" (pod ExpoImage)');
    expect(report).toContain('SomeUnmappedPod');
  });

  it('keeps the dependencies it resolved, and their subspecs, out of that warning', () => {
    const report = printed(logs.warn);
    expect(report).not.toContain('SDWebImage');
    expect(report).not.toContain('libavif');
  });
});

describe('a dependency that collides with a precompiled module', () => {
  captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-collision-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const fooRoot = path.join(tmp, 'expo-foo');
    const fooPodspecDir = mixedModule(fooRoot, 'ExpoFoo');

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        { packageName: 'expo-foo', pods: [{ podName: 'ExpoFoo', podspecDir: fooPodspecDir }] },
      ],
      extraDependencies: [],
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'ExpoFoo'
        ? {
            id: frameworkName === 'ExpoFoo' ? 'expo-foo' : 'expo-modules-core',
            frameworkName,
            flavors: { debug: `/abs/${frameworkName}.xcframework` },
          }
        : null
    );
    // `Foo` and `ExpoFoo` are different products with the same stable id.
    resolveSpmDependencyFrameworks.mockReturnValue([
      { id: 'expo-foo', frameworkName: 'Foo', flavors: { debug: '/abs/Foo.xcframework' } },
    ]);
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync naming both products, instead of handing React Native a graph it rejects', () => {
    expect(thrown).not.toBeNull();
    expect(thrown.message).toContain('ExpoFoo');
    expect(thrown.message).toContain('Foo');
    expect(thrown.message).toContain('framework id "expo-foo"');
  });
});

describe('a package whose first pod alone is precompiled', () => {
  const logs = captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-multipod-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const multiPodspecDir = mixedModule(path.join(tmp, 'expo-multi'), 'ExpoMulti');
    fs.writeFileSync(
      path.join(multiPodspecDir, 'ExpoMulti.podspec'),
      spec("  s.dependency 'SomeUnmappedPod'")
    );

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: 'expo-multi',
          pods: [
            { podName: 'ExpoMulti', podspecDir: multiPodspecDir },
            { podName: 'ExpoMultiHelper', podspecDir: multiPodspecDir },
          ],
        },
      ],
      extraDependencies: [],
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'ExpoMulti'
        ? { id: frameworkName.toLowerCase(), frameworkName }
        : null
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  // The sibling pod is buildable neither way, so the sync fails on it — as it did
  // before this change. The warning is what must not double.
  it('fails only on the sibling pod SwiftPM cannot build', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([expect.objectContaining({ podName: 'ExpoMultiHelper' })]);
  });

  it('warns about its unmapped dependencies once, not once per pass', () => {
    const report = printed(logs.warn);
    expect(report.match(/warning: Expo module "expo-multi"/g)).toHaveLength(1);
  });
});

describe('the checked-in manifest branch', () => {
  const logs = captureConsole();
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-plugin-manifest-');
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
    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: 'expo-vendored',
          pods: [{ podName: 'ExpoVendored', podspecDir: vendoredPodspecDir }],
        },
      ],
      extraDependencies: [],
    });
    thrown = thrownBy(() => runPlugin(tmp));
  });

  it('fails the sync for a manifest depending on a target it cannot declare', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'unsupported-target-dependency',
        podName: 'ExpoVendored',
        dependencies: [{ target: 'ExpoVendored', dependsOn: 'VendoredKit', kind: 'binary' }],
      }),
    ]);
    expect(printed(logs.error)).toContain(
      'target "ExpoVendored" depends on "VendoredKit", a binary target'
    );
  });

  it('emits no package for it', () => {
    expect(
      fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoVendored', 'Package.swift'))
    ).toBe(false);
  });
});

// React Native hands the plugin its own autolinking data (`context.autolinking`,
// the raw autolinking.json). Its `root` is where Node resolves the package from
// the app — a resolved answer to the question the filesystem walk guesses at.
describe('the module root React Native autolinked', () => {
  captureConsole();
  let roots;
  let podspecDirs;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-autolinked-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = {
      documented: path.join(tmp, 'node_modules', 'expo-documented'),
      documentedElsewhere: path.join(tmp, 'other', 'expo-documented'),
      autolinked: path.join(tmp, 'node_modules', 'expo-autolinked'),
      fallback: path.join(tmp, 'expo-fallback'),
      gone: path.join(tmp, 'gone'),
    };
    pureSwiftModule(roots.documented, 'ExpoDocumented', spec());
    pureSwiftModule(roots.documentedElsewhere, 'ExpoDocumented', spec());
    pureSwiftModule(roots.autolinked, 'ExpoAutolinked', spec());
    podspecDirs = {
      documented: podspecOnly(tmp, 'ExpoDocumented'),
      autolinked: podspecOnly(tmp, 'ExpoAutolinked'),
      fallback: pureSwiftModule(roots.fallback, 'ExpoFallback', spec()),
    };

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: 'expo-documented',
          pods: [{ podName: 'ExpoDocumented', podspecDir: podspecDirs.documented }],
        },
        {
          packageName: 'expo-autolinked',
          pods: [{ podName: 'ExpoAutolinked', podspecDir: podspecDirs.autolinked }],
        },
        {
          packageName: 'expo-fallback',
          pods: [{ podName: 'ExpoFallback', podspecDir: podspecDirs.fallback }],
        },
      ],
      extraDependencies: [],
    });
    prebuiltMetadata.mockReturnValue({
      ExpoDocumented: {
        type: 'internal',
        npmPackage: 'expo-documented',
        packageRoot: roots.documented,
        podspecDir: podspecDirs.documented,
        productName: 'ExpoDocumented',
      },
    });
    resolveFlavoredFramework.mockClear();
    findModuleRoot.mockClear();
    providerWrittenTo(path.join(tmp, 'out'));
    runPlugin(tmp, {
      autolinking: {
        dependencies: {
          'expo-documented': { root: roots.documentedElsewhere },
          'expo-autolinked': { root: roots.autolinked },
          'expo-fallback': { root: roots.gone },
        },
      },
    });
  });

  afterAll(restoreModuleMocks);

  it('keeps the documented root when the document and autolinking disagree', () => {
    expect(resolvedFor('expo-documented')).toMatchObject({ moduleRoot: roots.documented });
  });

  it('takes the autolinked root for a module the document does not cover', () => {
    expect(resolvedFor('expo-autolinked')).toMatchObject({ moduleRoot: roots.autolinked });
    expect(findModuleRoot).not.toHaveBeenCalledWith(podspecDirs.autolinked);
  });

  it('walks the filesystem when the autolinked root is not on disk', () => {
    expect(resolvedFor('expo-fallback')).toMatchObject({ moduleRoot: roots.fallback });
    expect(findModuleRoot).toHaveBeenCalledWith(podspecDirs.fallback);
  });
});

// React Native passes `autolinkingData ?? {}`, so an empty object is a value of
// the contract, not a broken call.
describe('a sync React Native passes no autolinking data for', () => {
  captureConsole();
  let root;
  let podspecDir;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-no-autolinking-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    root = path.join(tmp, 'node_modules', 'expo-walked');
    podspecDir = pureSwiftModule(root, 'ExpoWalked', spec());

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        { packageName: 'expo-walked', pods: [{ podName: 'ExpoWalked', podspecDir }] },
      ],
      extraDependencies: [],
    });
    resolveFlavoredFramework.mockClear();
    findModuleRoot.mockClear();
    providerWrittenTo(path.join(tmp, 'out'));
    runPlugin(tmp, { autolinking: {} });
  });

  afterAll(restoreModuleMocks);

  it('resolves every module root by walking the filesystem, as before', () => {
    expect(resolvedFor('expo-walked')).toMatchObject({ moduleRoot: root });
    expect(findModuleRoot).toHaveBeenCalledWith(podspecDir);
  });
});

// Two real copies of one package: the plugin builds the documented one while the
// app's JavaScript imports the autolinked one.
describe('a module installed twice', () => {
  const logs = captureConsole();
  let roots;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-two-copies-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = {
      linked: path.join(tmp, 'node_modules', 'expo-linked'),
      linkedThrough: path.join(tmp, 'links', 'expo-linked'),
      duplicated: path.join(tmp, 'node_modules', 'expo-duplicated'),
      duplicatedCopy: path.join(tmp, 'node_modules', 'some-lib', 'node_modules', 'expo-duplicated'),
    };
    const podspecDirs = {
      linked: pureSwiftModule(roots.linked, 'ExpoLinked', spec()),
      duplicated: pureSwiftModule(roots.duplicated, 'ExpoDuplicated', spec()),
    };
    pureSwiftModule(roots.duplicatedCopy, 'ExpoDuplicated', spec());
    fs.mkdirSync(path.join(tmp, 'links'), { recursive: true });
    fs.symlinkSync(roots.linked, roots.linkedThrough, 'dir');

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: 'expo-linked',
          pods: [{ podName: 'ExpoLinked', podspecDir: podspecDirs.linked }],
        },
        {
          packageName: 'expo-duplicated',
          pods: [{ podName: 'ExpoDuplicated', podspecDir: podspecDirs.duplicated }],
        },
      ],
      extraDependencies: [],
    });
    prebuiltMetadata.mockReturnValue({
      ExpoLinked: {
        type: 'internal',
        npmPackage: 'expo-linked',
        packageRoot: roots.linked,
        podspecDir: podspecDirs.linked,
        productName: 'ExpoLinked',
      },
      ExpoDuplicated: {
        type: 'internal',
        npmPackage: 'expo-duplicated',
        packageRoot: roots.duplicated,
        podspecDir: podspecDirs.duplicated,
        productName: 'ExpoDuplicated',
      },
    });
    providerWrittenTo(path.join(tmp, 'out'));
    runPlugin(tmp, {
      autolinking: {
        dependencies: {
          'expo-linked': { root: roots.linkedThrough },
          'expo-duplicated': { root: roots.duplicatedCopy },
        },
      },
    });
  });

  afterAll(restoreModuleMocks);

  // The module root is resolved once per pass; the warning belongs to the module.
  it('warns once, naming both directories', () => {
    expect(printed(logs.warn).match(/warning: Expo module "expo-duplicated"/g)).toHaveLength(1);
    expect(printed(logs.warn)).toContain(roots.duplicated);
    expect(printed(logs.warn)).toContain(roots.duplicatedCopy);
  });

  it('says nothing about a root reached through a symlink', () => {
    expect(printed(logs.warn)).not.toContain('expo-linked');
  });
});

// The plugin resolves a module root per POD, so a package whose second pod
// documents a second copy is built from that copy even when its first pod
// agrees with the root the app imports.
describe('a module whose pods document two different copies', () => {
  const logs = captureConsole();
  let roots;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-pod-copies-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = {
      multi: path.join(tmp, 'node_modules', 'expo-multi'),
      multiCopy: path.join(tmp, 'node_modules', 'some-lib', 'node_modules', 'expo-multi'),
    };
    const podspecDir = pureSwiftModule(roots.multi, 'ExpoMultiA', spec());
    fs.writeFileSync(path.join(podspecDir, 'ExpoMultiB.podspec'), spec());
    pureSwiftModule(roots.multiCopy, 'ExpoMultiB', spec());

    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        {
          packageName: 'expo-multi',
          pods: [
            { podName: 'ExpoMultiA', podspecDir },
            { podName: 'ExpoMultiB', podspecDir },
          ],
        },
      ],
      extraDependencies: [],
    });
    prebuiltMetadata.mockReturnValue({
      ExpoMultiA: {
        type: 'internal',
        npmPackage: 'expo-multi',
        packageRoot: roots.multi,
        podspecDir,
        productName: 'ExpoMultiA',
      },
      ExpoMultiB: {
        type: 'internal',
        npmPackage: 'expo-multi',
        packageRoot: roots.multiCopy,
        podspecDir,
        productName: 'ExpoMultiB',
      },
    });
    providerWrittenTo(path.join(tmp, 'out'));
    runPlugin(tmp, { autolinking: { dependencies: { 'expo-multi': { root: roots.multi } } } });
  });

  afterAll(restoreModuleMocks);

  // The first pod agrees with the autolinked root; only the second one does not.
  it('warns about the copy its second pod builds from', () => {
    expect(printed(logs.warn)).toContain('Expo module "expo-multi" is installed twice');
    expect(printed(logs.warn).match(/is installed twice/g)).toHaveLength(1);
    expect(printed(logs.warn)).toContain(roots.multiCopy);
  });
});

// `extraPods` in the app config lands in Podfile.properties.json. The plugin reads
// that file through the autolinking CLI but installs nothing from it, so it names
// the pods and builds on.
describe('the extra CocoaPods dependencies an app declares', () => {
  const logs = captureConsole({ each: true });
  let outDir;

  const run = (extraDependencies) => {
    const tmp = makeTempDir('expo-spm-extra-pods-');
    outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const podspecDir = pureSwiftModule(path.join(tmp, 'expo-extra'), 'ExpoExtra', spec());
    resolveExpoModules.mockReturnValue({
      modules: [
        {
          packageName: 'expo-modules-core',
          pods: [{ podName: 'ExpoModulesCore', podspecDir: core }],
        },
        { packageName: 'expo-extra', pods: [{ podName: 'ExpoExtra', podspecDir }] },
      ],
      extraDependencies,
    });
    providerWrittenTo(outDir);
    return runPlugin(tmp, { autolinking: {} });
  };

  afterEach(restoreModuleMocks);

  // A pod the plugin cannot install is not a reason to fail the sync: a warning
  // reports it, and every package the plugin can emit is still emitted.
  it('warns about each pod, and emits its packages anyway', () => {
    expect(() =>
      run([
        { name: 'MyLocalPod', path: '../vendor/MyLocalPod' },
        { name: 'Firebase', git: 'https://github.com/firebase/firebase-ios-sdk.git' },
      ])
    ).not.toThrow();

    const report = printed(logs.warn);
    expect(report).toContain('MyLocalPod');
    expect(report).toContain('Firebase');
    expect(report).toContain('Podfile.properties.json');
    expect(
      fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoExtra', 'Package.swift'))
    ).toBe(true);
  });

  it('says nothing when the app declares no extra pods', () => {
    run([]);

    expect(printed(logs.warn)).not.toContain('Podfile.properties.json');
  });
});
