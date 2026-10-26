'use strict';

const fs = require('fs');
const path = require('path');

jest.mock('../cli', () => ({
  resolveExpoModules: jest.fn(),
  prebuiltMetadata: jest.fn(() => ({})),
  generateModulesProvider: jest.fn(() => null),
  runDumpPackage: jest.fn(),
}));
// The properties reader stays real, so a gated product is decided by a file on
// disk rather than by a stand-in for it.
jest.mock('../app-target', () => ({
  ...jest.requireActual('../app-target'),
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
  hasPrecompiledArtifact: jest.fn(() => false),
  resolveHeadersXCFramework: jest.fn(() => null),
  prepareCompileInterfaces: jest.fn(() => '/abs/interfaces'),
  frameworkSource: jest.fn(() => null),
  resolveHeadersXCFrameworkWithSource: jest.fn(({ productName }) => ({
    xcframework: `/abs/${productName}Headers.xcframework`,
    source: null,
  })),
}));
// The module-root walk stays real; it is spied on so a test can assert that a
// root React Native already resolved made the walk unnecessary.
jest.mock('../classify', () => {
  const actual = jest.requireActual('../classify');
  return { ...actual, findModuleRoot: jest.fn(actual.findModuleRoot) };
});
// The pure-Swift emitter stays real; it is spied on so a test can count its calls
// or stand in an outcome the real emitter has no fixture for.
jest.mock('../manifests', () => {
  const actual = jest.requireActual('../manifests');
  return { ...actual, emitPureSwiftSourcePackage: jest.fn(actual.emitPureSwiftSourcePackage) };
});
// The real direct emitter builds a compile-only xcframework with xcrun.
jest.mock('../direct', () => ({
  ...jest.requireActual('../direct'),
  emitDirectPackage: jest.fn(),
}));

const {
  resolveExpoModules,
  prebuiltMetadata,
  generateModulesProvider,
  runDumpPackage,
} = require('../cli');
const { resolveAppTarget } = require('../app-target');
const { findModuleRoot } = require('../classify');
const { spmUpdateCommand } = require('../commands');
const { UnsupportedModulesError, renderBuildFromSourceFallbackWarning } = require('../diagnostics');
const { emitDirectPackage } = require('../direct');
const { emitPureSwiftSourcePackage } = require('../manifests');
const {
  artifactBaseDirs,
  frameworkSource,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveHeadersXCFramework,
  resolveHeadersXCFrameworkWithSource,
  resolveSpmDependencyFrameworks,
  hasPrecompiledArtifact,
} = require('../flavored-frameworks');
const {
  captureConsole,
  makeTempDir,
  metadataEntry,
  printed,
  removeTempDirs,
  rerunSpmUpdate,
  runPlugin,
  spec,
  thrownBy,
} = require('./helpers');

afterAll(removeTempDirs);

/** A `resolve` result from `[packageName, [[podName, podspecDir], …]]` per module. */
function modulesOf(modules, extraDependencies = []) {
  return {
    modules: modules.map(([packageName, pods]) => ({
      packageName,
      pods: pods.map(([podName, podspecDir]) => ({ podName, podspecDir })),
    })),
    extraDependencies,
  };
}

const coreAt = (podspecDir) => ['expo-modules-core', [['ExpoModulesCore', podspecDir]]];

function pureSwiftModule(root, podName, podspec) {
  const podspecDir = path.join(root, 'ios');
  fs.mkdirSync(podspecDir, { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"module"}');
  fs.writeFileSync(path.join(podspecDir, 'A.swift'), '// swift\n');
  fs.writeFileSync(path.join(podspecDir, `${podName}.podspec`), podspec);
  return podspecDir;
}

/** Writes `spm.config.json` at a module root: an object as JSON, or raw text. */
function writeSpmConfig(root, config) {
  fs.writeFileSync(
    path.join(root, 'spm.config.json'),
    typeof config === 'string' ? config : JSON.stringify(config)
  );
}

/**
 * `swift package dump-package` JSON for a checked-in manifest exporting `product`, whose
 * target depends on the ExpoModulesCoreHeaders product when `onCoreHeaders` is set.
 */
function dumpedManifest(name, product, { onCoreHeaders }) {
  return JSON.stringify({
    name,
    dependencies: onCoreHeaders ? [{ fileSystem: [{ identity: 'expomodulescoreheaders' }] }] : [],
    products: [{ name: product, type: { library: ['automatic'] }, targets: [product] }],
    targets: [
      {
        name: product,
        type: 'regular',
        path: 'ios',
        dependencies: onCoreHeaders
          ? [{ product: ['ExpoModulesCoreHeaders', 'ExpoModulesCoreHeaders', null, null] }]
          : [],
      },
    ],
  });
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
  hasPrecompiledArtifact.mockReset();
  hasPrecompiledArtifact.mockReturnValue(false);
  resolveHeadersXCFramework.mockReset();
  resolveHeadersXCFramework.mockReturnValue(null);
  prepareCompileInterfaces.mockImplementation(() => '/abs/interfaces');
  frameworkSource.mockImplementation(() => null);
  resolveHeadersXCFrameworkWithSource.mockImplementation(({ productName }) => ({
    xcframework: `/abs/${productName}Headers.xcframework`,
    source: null,
  }));
}

const barcodeGate = {
  podfileProperty: 'expo.camera.barcode-scanner-enabled',
  disabledValue: 'false',
};

/** Points the app target at a real Podfile.properties.json (an object, or raw text), or none. */
function withPodfileProperties(tmp, properties) {
  const appIosDir = path.join(tmp, 'app', 'ios');
  fs.mkdirSync(appIosDir, { recursive: true });
  let podfilePropertiesPath = null;
  if (properties != null) {
    podfilePropertiesPath = path.join(appIosDir, 'Podfile.properties.json');
    fs.writeFileSync(
      podfilePropertiesPath,
      typeof properties === 'string' ? properties : JSON.stringify(properties)
    );
  }
  resolveAppTarget.mockReset();
  resolveAppTarget.mockReturnValue({
    targetName: null,
    entitlementPath: null,
    podfilePropertiesPath,
  });
}

/** The warnings naming modules a buildFromSource pattern matched that were linked precompiled. */
const fallbackWarnings = (logs) =>
  logs.warn.mock.calls.map(([text]) => text).filter((text) => text.includes('buildFromSource'));

const coreFallback = (entry) => ({
  podName: 'ExpoModulesCore',
  packageName: 'expo-modules-core',
  entry,
});

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
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(dirs.core),
        ['expo-asset', [['ExpoAsset', dirs.good]]],
        ['expo-media-library', [['ExpoMediaLibrary', dirs.linked]]],
        ['expo-screen-capture', [['ExpoScreenCapture', dirs.xcconfig]]],
        ['expo-localization', [['ExpoLocalization', dirs.rootPodspecDir]]],
      ])
    );
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
    resolveExpoModules.mockReturnValue(modulesOf([coreAt(core)]));
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
    expect(run).toThrow(spmUpdateCommand());
    expect(printed(logs.warn)).not.toContain('ExpoModulesProvider');
  });

  // Workspaces hoist react-native above the app, where node_modules/react-native is missing.
  it("names the update command through the app's react-native, relative to the app root", () => {
    generateModulesProvider.mockImplementation(() => {
      throw new Error('expo-modules-autolinking exited with code 1');
    });
    const hoistedApp = () =>
      runPlugin(tmp, {
        projectRoot: path.join(tmp, 'apps', 'mobile'),
        appRoot: path.join(tmp, 'apps', 'mobile', 'ios'),
        reactNativeRoot: path.join(tmp, 'node_modules', 'react-native'),
      });

    expect(hoistedApp).toThrow(
      '`node ../../node_modules/react-native/scripts/setup-apple-spm.js update`'
    );
  });

  it('resolves a hoisted react-native from the app root when the context names none', () => {
    generateModulesProvider.mockImplementation(() => {
      throw new Error('expo-modules-autolinking exited with code 1');
    });
    const reactNativeRoot = path.join(tmp, 'node_modules', 'react-native');
    fs.mkdirSync(reactNativeRoot, { recursive: true });
    fs.writeFileSync(path.join(reactNativeRoot, 'package.json'), '{"name":"react-native"}');
    const hoistedApp = () =>
      runPlugin(tmp, {
        projectRoot: path.join(tmp, 'apps', 'mobile'),
        appRoot: path.join(tmp, 'apps', 'mobile', 'ios'),
        reactNativeRoot: undefined,
      });

    expect(hoistedApp).toThrow(
      '`node ../../node_modules/react-native/scripts/setup-apple-spm.js update`'
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
    resolveExpoModules.mockReturnValue(modulesOf([]));
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

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(dirs.core),
        ['@shopify/react-native-skia', [['react-native-skia', dirs.skiaPodspecs]]],
        ['expo-worklets-adapter', [['ExpoModulesWorkletsAdapter', dirs.adapter]]],
        ['expo-legacy', [['ExpoLegacy', dirs.legacy]]],
        ['expo-stale', [['ExpoStale', dirs.stale]]],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      'react-native-skia': metadataEntry(dirs.skiaPackage, 'RNSkia'),
      ExpoModulesWorkletsAdapter: metadataEntry(
        path.dirname(dirs.adapter),
        'ExpoModulesWorkletsAdapter',
        { sourceOnly: true }
      ),
      ExpoStale: metadataEntry(dirs.vanished, 'ExpoStale'),
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
    writeSpmConfig(packageRoot, {});
    resolveExpoModules.mockReturnValue(modulesOf([coreAt(podspecDir)]));
    prebuiltMetadata.mockReturnValue({
      ExpoModulesCore: metadataEntry(packageRoot, 'ExpoModulesCore'),
    });
    providerWrittenTo(outDir);
    ({ watchPaths } = runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('watches the staleness inputs under the documented package root', () => {
    expect(watchPaths).toContain(path.join(packageRoot, 'expo-module.config.json'));
  });

  // It declares the products the plugin links precompiled.
  it('watches spm.config.json', () => {
    expect(watchPaths).toContain(path.join(packageRoot, 'spm.config.json'));
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

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['@shopify/react-native-skia', [['react-native-skia', skiaPodspecDir]]],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      'react-native-skia': metadataEntry(skiaPackage, 'RNSkia'),
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'RNSkia'
        ? { id: frameworkName.toLowerCase(), frameworkName }
        : null
    );
    providerWrittenTo(outDir);
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

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-remote', [['ExpoRemote', podspecDir]]]])
    );
    prebuiltMetadata.mockReturnValue({ ExpoRemote: metadataEntry(packageRoot, 'ExpoRemote') });
    providerWrittenTo(outDir);
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
    expect(out).toMatch(/expo-modules-macros\/apple\/ExpoModulesMacros#ExpoModulesMacros/);
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
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(dirs.core),
        ['expo-low', [['ExpoLow', dirs.low]]],
        ['expo-high', [['ExpoHigh', dirs.high]]],
        ['expo-disagreeing', [['ExpoDisagreeing', dirs.disagreeing]]],
        ['expo-absent', [['ExpoAbsent', dirs.absent]]],
      ])
    );
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
    providerWrittenTo(outDir);
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

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-image', [['ExpoImage', imagePodspecDir]]]])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoImage: {
        packageRoot: roots.image,
        productName: 'ExpoImage',
        spmPackages: [
          {
            url: 'https://github.com/SDWebImage/SDWebImage.git',
            productName: 'SDWebImage',
            version: { exact: '5.21.6' },
          },
          {
            url: 'https://github.com/SDWebImage/libavif-Xcode.git',
            productName: 'libavif',
            version: { exact: '1.0.0' },
          },
        ],
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
    providerWrittenTo(outDir);
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

  it('resolves them from the product names of the spmPackages a precompiled pod declares', () => {
    expect(resolveSpmDependencyFrameworks).toHaveBeenCalledWith([
      expect.objectContaining({
        podName: 'ExpoModulesCore',
        moduleRoot: roots.core,
        spmDependencies: [],
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

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-foo', [['ExpoFoo', fooPodspecDir]]]])
    );
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

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-multi',
          [
            ['ExpoMulti', multiPodspecDir],
            ['ExpoMultiHelper', multiPodspecDir],
          ],
        ],
      ])
    );
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
    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-vendored', [['ExpoVendored', vendoredPodspecDir]]]])
    );
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

describe('a module with a checked-in manifest', () => {
  const logs = captureConsole({ each: true });

  afterEach(() => {
    emitDirectPackage.mockReset();
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  /**
   * Syncs expo-haptics (pod ExpoHaptics) with a checked-in manifest that depends on the
   * ExpoModulesCore headers when `onCoreHeaders`, an artifact when `precompiled`, the app's
   * `buildFromSource` patterns, and `spmConfig` as its spm.config.json.
   */
  function sync({ onCoreHeaders, precompiled, buildFromSource, spmConfig }) {
    const tmp = makeTempDir('expo-spm-direct-rule-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const moduleRoot = path.join(tmp, 'expo-haptics');
    const podspecDir = pureSwiftModule(moduleRoot, 'ExpoHaptics', spec());
    fs.writeFileSync(path.join(moduleRoot, 'Package.swift'), '// swift-tools-version: 6.0\n');
    if (spmConfig != null) writeSpmConfig(moduleRoot, spmConfig);
    runDumpPackage.mockReturnValue(
      dumpedManifest('expo-haptics', 'ExpoHaptics', { onCoreHeaders })
    );
    resolveExpoModules.mockReturnValue({
      ...modulesOf([coreAt(core), ['expo-haptics', [['ExpoHaptics', podspecDir]]]]),
      ...(buildFromSource != null ? { buildFromSource } : {}),
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || (precompiled && frameworkName === 'ExpoHaptics')
        ? { id: frameworkName, frameworkName }
        : null
    );
    emitDirectPackage.mockReturnValue({
      ok: {
        packageDep: { name: 'expo-haptics', path: moduleRoot },
        productDeps: [{ name: 'ExpoHaptics', package: 'expo-haptics' }],
        spmProductNames: [],
        partlyProvidedPackages: [],
      },
    });
    const outDir = path.join(tmp, 'out');
    providerWrittenTo(outDir);
    let result = null;
    const thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
    return {
      thrown,
      moduleRoot,
      generatedManifest: path.join(outDir, 'expo', 'expo-source', 'expo-haptics', 'Package.swift'),
      frameworks: result?.flavoredFrameworks.map((f) => f.frameworkName).sort(),
    };
  }

  const linkedPrecompiled = ({ thrown, frameworks }) => {
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoHaptics', 'ExpoModulesCore']);
    expect(emitDirectPackage).not.toHaveBeenCalled();
  };

  const builtDirect = ({ thrown, frameworks, moduleRoot }) => {
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoModulesCore']);
    expect(emitDirectPackage).toHaveBeenCalledTimes(1);
    expect(emitDirectPackage).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleRoot,
        packageName: 'expo-haptics',
        manifest: expect.objectContaining({ name: 'expo-haptics' }),
      })
    );
    expect(printed(logs.log)).toContain('source via direct checked-in manifest (1): expo-haptics');
  };

  it('links its artifact, though the manifest depends on the ExpoModulesCore headers', () => {
    linkedPrecompiled(sync({ onCoreHeaders: true, precompiled: true }));
  });

  it('never evaluates the manifest of a module linked precompiled', () => {
    sync({ onCoreHeaders: true, precompiled: true });
    expect(runDumpPackage).not.toHaveBeenCalled();
  });

  it('is built from a manifest that depends on the ExpoModulesCore headers when it has no artifact', () => {
    builtDirect(sync({ onCoreHeaders: true, precompiled: false }));
  });

  it('is built from a generated package, though it has an artifact, when buildFromSource lists it and its manifest does not depend on the ExpoModulesCore headers', () => {
    const { thrown, frameworks, generatedManifest } = sync({
      onCoreHeaders: false,
      precompiled: true,
      buildFromSource: ['expo-haptics'],
    });
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoModulesCore']);
    expect(emitDirectPackage).not.toHaveBeenCalled();
    expect(fs.existsSync(generatedManifest)).toBe(true);
    expect(printed(logs.log)).toContain('source via checked-in manifest (1): expo-haptics');
  });

  it('is built from a generated package when its manifest does not depend on the ExpoModulesCore headers', () => {
    const { thrown, generatedManifest } = sync({ onCoreHeaders: false, precompiled: false });
    expect(thrown).toBeNull();
    expect(emitDirectPackage).not.toHaveBeenCalled();
    expect(fs.existsSync(generatedManifest)).toBe(true);
    expect(printed(logs.log)).toContain('source via checked-in manifest (1): expo-haptics');
    expect(printed(logs.log)).toContain('source via direct checked-in manifest (0): —');
  });

  it.each([
    ['as it stands', true],
    ['through a generated package', false],
  ])('evaluates its manifest once when it is built %s', (_, onCoreHeaders) => {
    sync({ onCoreHeaders, precompiled: false });
    expect(runDumpPackage).toHaveBeenCalledTimes(1);
  });

  // CocoaPods matches each entry as `^entry$` against the pod name and the npm package name:
  // precompiled_modules.rb#build_from_source?.
  it.each([
    ['its pod name', ['ExpoHaptics']],
    ['its npm package name', ['expo-haptics']],
    ['a pattern matching its npm package name', ['expo-hap.*']],
    ['a pattern matching its pod name', ['Expo(Haptics|Camera)']],
    ['one of several entries', ['expo-camera', 'ExpoHap.*']],
  ])(
    'is built from source, though it has an artifact, when buildFromSource lists %s',
    (_, buildFromSource) => {
      builtDirect(sync({ onCoreHeaders: true, precompiled: true, buildFromSource }));
    }
  );

  it.each([['Haptics'], ['expo-hap'], ['Expo'], ['xExpoHaptics']])(
    'links its artifact when buildFromSource lists %s, which matches only part of a name',
    (entry) => {
      linkedPrecompiled(sync({ onCoreHeaders: true, precompiled: true, buildFromSource: [entry] }));
    }
  );

  it('fails the sync naming a buildFromSource entry that is not a regular expression', () => {
    const { thrown } = sync({
      onCoreHeaders: true,
      precompiled: true,
      buildFromSource: ['expo-(haptics'],
    });
    expect(thrown?.message).toContain('"expo-(haptics"');
    expect(thrown.message).toContain('buildFromSource');
    expect(thrown.message).toContain('regular expression');
    expect(thrown.message).toContain(rerunSpmUpdate);
    expect(thrown.cause).toBeInstanceOf(SyntaxError);
  });

  it('is built from source when a pattern matches every module, and only ExpoModulesCore is named as linked precompiled', () => {
    builtDirect(sync({ onCoreHeaders: true, precompiled: true, buildFromSource: ['.*'] }));
    expect(fallbackWarnings(logs)).toEqual([
      renderBuildFromSourceFallbackWarning([coreFallback('.*')]),
    ]);
  });

  // The plugin decides from the manifest alone; the flag an earlier preview read means nothing.
  it('ignores a "directManifest" flag left in its spm.config.json', () => {
    linkedPrecompiled(
      sync({ onCoreHeaders: false, precompiled: true, spmConfig: { directManifest: true } })
    );
  });

  it('is not built from its manifest as it stands because of a "directManifest" flag', () => {
    const { thrown, generatedManifest } = sync({
      onCoreHeaders: false,
      precompiled: false,
      spmConfig: { directManifest: true },
    });
    expect(thrown).toBeNull();
    expect(emitDirectPackage).not.toHaveBeenCalled();
    expect(fs.existsSync(generatedManifest)).toBe(true);
  });

  it('syncs when its spm.config.json is not valid JSON', () => {
    const { thrown } = sync({
      onCoreHeaders: true,
      precompiled: false,
      spmConfig: '{ "directManifest": true,',
    });
    expect(thrown).toBeNull();
    expect(emitDirectPackage).toHaveBeenCalledTimes(1);
  });
});

/**
 * Syncs ExpoMixed (pod) with `sources` of 'mixed', 'pure-swift' or 'pure-swift with podspec
 * linkage' and no checked-in manifest, listed by each of `packageNames` (default
 * expo-mixed) at one module root; an artifact when `precompiled`; and `buildFromSource`.
 */
function syncWithoutManifest(
  tmp,
  { sources, precompiled, buildFromSource, packageNames = ['expo-mixed'] }
) {
  const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
  const moduleRoot = path.join(tmp, 'expo-mixed');
  const podspecs = {
    mixed: () => mixedModule(moduleRoot, 'ExpoMixed'),
    'pure-swift': () => pureSwiftModule(moduleRoot, 'ExpoMixed', spec()),
    'pure-swift with podspec linkage': () =>
      pureSwiftModule(moduleRoot, 'ExpoMixed', spec("  s.frameworks = 'Photos'")),
  };
  const podspecDir = podspecs[sources]();
  resolveExpoModules.mockReturnValue({
    ...modulesOf([
      coreAt(core),
      ...packageNames.map((packageName) => [packageName, [['ExpoMixed', podspecDir]]]),
    ]),
    buildFromSource,
  });
  prebuiltMetadata.mockReturnValue({ ExpoMixed: metadataEntry(moduleRoot, 'ExpoMixed') });
  const hasArtifact = (frameworkName) =>
    frameworkName === 'ExpoModulesCore' || (precompiled && frameworkName === 'ExpoMixed');
  hasPrecompiledArtifact.mockImplementation(({ frameworkName }) => hasArtifact(frameworkName));
  resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
    hasArtifact(frameworkName) ? { id: frameworkName, frameworkName } : null
  );
  resolveFlavoredFramework.mockClear();
  providerWrittenTo(path.join(tmp, 'out'));
  let result = null;
  const thrown = thrownBy(() => {
    result = runPlugin(tmp);
  });
  return {
    thrown,
    moduleRoot,
    frameworks: result?.flavoredFrameworks.map((f) => f.frameworkName).sort(),
  };
}

describe('a module without a checked-in manifest that buildFromSource names', () => {
  const logs = captureConsole({ each: true });

  afterEach(restoreModuleMocks);

  const sync = (options) => syncWithoutManifest(makeTempDir('expo-spm-forced-source-'), options);

  it('is built from a generated pure-Swift package, though it has an artifact', () => {
    const { thrown, frameworks } = sync({
      sources: 'pure-swift',
      precompiled: true,
      buildFromSource: ['ExpoMixed'],
    });
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoModulesCore']);
    expect(printed(logs.log)).toContain('source pure-Swift (1): ExpoMixed');
  });

  it('fails the sync naming buildFromSource, not the missing prebuild', () => {
    const { thrown, moduleRoot } = sync({
      sources: 'mixed',
      precompiled: true,
      buildFromSource: ['expo-mixed'],
    });
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'build-from-source-unsupported',
        podName: 'ExpoMixed',
        packageName: 'expo-mixed',
        moduleRoot,
        buildFromSourceEntry: 'expo-mixed',
        cause: { reason: 'mixed-no-manifest', productName: 'ExpoMixed' },
      },
    ]);
    expect(printed(logs.error)).toContain(
      'error: Expo module "expo-mixed" (pod ExpoMixed) is listed in buildFromSource, but Swift Package Manager cannot build it from source.'
    );
    expect(hasPrecompiledArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ packageName: 'expo-mixed', frameworkName: 'ExpoMixed' })
    );
    expect(resolveFlavoredFramework).not.toHaveBeenCalledWith(
      expect.objectContaining({ frameworkName: 'ExpoMixed' })
    );
  });

  it('names the podspec linkage of a pure-Swift module as the cause', () => {
    const { thrown } = sync({
      sources: 'pure-swift with podspec linkage',
      precompiled: true,
      buildFromSource: ['ExpoMixed'],
    });
    expect(thrown?.unsupported).toEqual([
      expect.objectContaining({
        reason: 'build-from-source-unsupported',
        cause: expect.objectContaining({ reason: 'needs-manifest-for-linkage' }),
      }),
    ]);
  });

  // Taking the entry out would not help: there is no XCFramework to fall back to.
  it('reports what it would report without buildFromSource when there is no artifact', () => {
    const { thrown } = sync({
      sources: 'mixed',
      precompiled: false,
      buildFromSource: ['ExpoMixed'],
    });
    expect(thrown?.unsupported).toEqual([
      expect.objectContaining({ reason: 'prebuild-available', podName: 'ExpoMixed' }),
    ]);
  });
});

describe('a module without a checked-in manifest that a buildFromSource pattern matches', () => {
  const logs = captureConsole({ each: true });

  afterEach(restoreModuleMocks);

  const sync = (options) => syncWithoutManifest(makeTempDir('expo-spm-pattern-source-'), options);
  const mixedFallback = (entry) => ({ podName: 'ExpoMixed', packageName: 'expo-mixed', entry });

  it('is linked precompiled, as ExpoModulesCore is, when it cannot be built from source', () => {
    const { thrown, frameworks } = sync({
      sources: 'mixed',
      precompiled: true,
      buildFromSource: ['.*'],
    });
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoMixed', 'ExpoModulesCore']);
    expect(printed(logs.log)).toContain(
      'paired runtime frameworks (2): ExpoModulesCore, ExpoMixed'
    );
    expect(resolveSpmDependencyFrameworks).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ podName: 'ExpoMixed' })])
    );
    expect(prepareCompileInterfaces).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ frameworkName: 'ExpoMixed' })]),
      expect.any(String)
    );
    expect(fallbackWarnings(logs)).toEqual([
      renderBuildFromSourceFallbackWarning([coreFallback('.*'), mixedFallback('.*')]),
    ]);
  });

  it('is linked precompiled whatever blocks its source build', () => {
    const { thrown, frameworks } = sync({
      sources: 'pure-swift with podspec linkage',
      precompiled: true,
      buildFromSource: ['ExpoMix.*'],
    });
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoMixed', 'ExpoModulesCore']);
    expect(fallbackWarnings(logs)).toEqual([
      renderBuildFromSourceFallbackWarning([mixedFallback('ExpoMix.*')]),
    ]);
  });

  it('is built from source when it can be, and is not named as linked precompiled', () => {
    const { thrown, frameworks } = sync({
      sources: 'pure-swift',
      precompiled: true,
      buildFromSource: ['.*'],
    });
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoModulesCore']);
    expect(printed(logs.log)).toContain('source pure-Swift (1): ExpoMixed');
    expect(fallbackWarnings(logs)).toEqual([
      renderBuildFromSourceFallbackWarning([coreFallback('.*')]),
    ]);
  });

  it('fails the sync for an entry naming it exactly, though a pattern matches it too', () => {
    const { thrown } = sync({
      sources: 'mixed',
      precompiled: true,
      buildFromSource: ['.*', 'ExpoMixed'],
    });
    expect(thrown?.unsupported).toEqual([
      expect.objectContaining({
        reason: 'build-from-source-unsupported',
        podName: 'ExpoMixed',
        buildFromSourceEntry: 'ExpoMixed',
      }),
    ]);
  });

  // There is no XCFramework to fall back to.
  it('reports what it would report without buildFromSource when there is no artifact', () => {
    const { thrown } = sync({
      sources: 'mixed',
      precompiled: false,
      buildFromSource: ['expo-mix.*'],
    });
    expect(thrown?.unsupported).toEqual([
      expect.objectContaining({ reason: 'prebuild-available', podName: 'ExpoMixed' }),
    ]);
  });

  it('warns about nothing when no module was linked precompiled in its place', () => {
    const { thrown } = sync({
      sources: 'pure-swift',
      precompiled: true,
      buildFromSource: ['ExpoMix.*'],
    });
    expect(thrown).toBeNull();
    expect(fallbackWarnings(logs)).toEqual([]);
  });
});

/**
 * Syncs `modules` (`[packageName, [podName, …], kind]`, kind 'mixed' or 'pure-swift'; the pods
 * share one module root) beside ExpoModulesCore with `buildFromSource: ['.*']`, and an artifact
 * for each pod `artifacts` names. The resolver links none of the pods `incomplete` names, though
 * an artifact is found for them.
 */
function syncWithPattern(tmp, modules, artifacts, incomplete = []) {
  const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
  const listed = modules.map(([packageName, podNames, kind]) => {
    const root = path.join(tmp, packageName);
    const podspecDir =
      kind === 'mixed'
        ? mixedModule(root, podNames[0])
        : pureSwiftModule(root, podNames[0], spec());
    return [packageName, podNames.map((podName) => [podName, podspecDir])];
  });
  resolveExpoModules.mockReturnValue({
    ...modulesOf([coreAt(core), ...listed]),
    buildFromSource: ['.*'],
  });
  const hasArtifact = (frameworkName) =>
    frameworkName === 'ExpoModulesCore' || artifacts.includes(frameworkName);
  hasPrecompiledArtifact.mockImplementation(({ frameworkName }) => hasArtifact(frameworkName));
  resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
    hasArtifact(frameworkName) && !incomplete.includes(frameworkName)
      ? { id: frameworkName, frameworkName }
      : null
  );
  providerWrittenTo(path.join(tmp, 'out'));
  let result = null;
  const thrown = thrownBy(() => {
    result = runPlugin(tmp);
  });
  return {
    thrown,
    result,
    frameworks: result?.flavoredFrameworks.map((f) => f.frameworkName).sort(),
  };
}

describe('modules linked precompiled because a buildFromSource pattern matched them', () => {
  const logs = captureConsole({ each: true });

  afterEach(() => {
    emitPureSwiftSourcePackage.mockClear();
    restoreModuleMocks();
  });

  it('are what a source module compiles against', () => {
    const lottie = { id: 'Lottie', frameworkName: 'Lottie' };
    resolveSpmDependencyFrameworks.mockImplementation((modules) =>
      modules.some((m) => m.podName === 'ExpoMixed') ? [lottie] : []
    );
    const { thrown, frameworks } = syncWithPattern(
      makeTempDir('expo-spm-pattern-dependent-'),
      [
        ['expo-mixed', ['ExpoMixed'], 'mixed'],
        ['expo-swift', ['ExpoSwift'], 'pure-swift'],
      ],
      ['ExpoMixed']
    );
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoMixed', 'ExpoModulesCore', 'Lottie']);
    expect(printed(logs.log)).toContain('source pure-Swift (1): ExpoSwift');
    const [emitted, emitContext] = emitPureSwiftSourcePackage.mock.lastCall;
    expect(emitted.product).toBe('ExpoSwift');
    expect([...emitContext.satisfiedDependencies]).toEqual(['Lottie']);
    expect(prepareCompileInterfaces).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ frameworkName: 'ExpoMixed' })]),
      expect.any(String)
    );
  });

  // Building the first pod from source beside its precompiled sibling would link the
  // sibling twice, so the first pod has no source build left either.
  it('take a sibling pod along, rather than leave it built from source', () => {
    const { thrown, frameworks, result } = syncWithPattern(
      makeTempDir('expo-spm-pattern-siblings-'),
      [['expo-multi', ['ExpoMultiA', 'ExpoMultiB'], 'pure-swift']],
      ['ExpoMultiA', 'ExpoMultiB']
    );
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoModulesCore', 'ExpoMultiA', 'ExpoMultiB']);
    expect(result.packageDependencies).toEqual([]);
    expect(printed(logs.log)).toContain('source pure-Swift (0): —');
    expect(fallbackWarnings(logs)).toEqual([
      renderBuildFromSourceFallbackWarning([
        coreFallback('.*'),
        { podName: 'ExpoMultiA', packageName: 'expo-multi', entry: '.*' },
        { podName: 'ExpoMultiB', packageName: 'expo-multi', entry: '.*' },
      ]),
    ]);
  });

  it('fail the sync naming the entry when the precompiled XCFramework cannot be linked', () => {
    const tmp = makeTempDir('expo-spm-pattern-incomplete-');
    const { thrown } = syncWithPattern(
      tmp,
      [['expo-mixed', ['ExpoMixed'], 'mixed']],
      ['ExpoMixed'],
      ['ExpoMixed']
    );
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'build-from-source-fallback-incomplete',
        podName: 'ExpoMixed',
        packageName: 'expo-mixed',
        moduleRoot: path.join(tmp, 'expo-mixed'),
        buildFromSourceEntry: '.*',
        cause: expect.objectContaining({ reason: 'mixed-no-manifest' }),
      },
    ]);
    expect(printed(logs.error)).toContain(
      'error: The buildFromSource entry ".*" matches Expo module "expo-mixed" (pod ExpoMixed), which Swift Package Manager cannot build from source, and its precompiled XCFramework is incomplete, so it cannot be linked precompiled either.'
    );
  });
});

describe('what a discarded round of the passes emitted', () => {
  captureConsole({ each: true });

  afterEach(() => {
    emitDirectPackage.mockReset();
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  const expoSource = (tmp, name) => path.join(tmp, 'out', 'expo', 'expo-source', name);

  it('is removed, and what the last round emitted is kept', () => {
    const tmp = makeTempDir('expo-spm-pattern-orphan-');
    fs.mkdirSync(expoSource(tmp, 'ExpoOther'), { recursive: true });
    const { thrown } = syncWithPattern(
      tmp,
      [
        ['expo-multi', ['ExpoMultiA', 'ExpoMultiB'], 'pure-swift'],
        ['expo-swift', ['ExpoSwift'], 'pure-swift'],
      ],
      ['ExpoMultiA', 'ExpoMultiB']
    );
    expect(thrown).toBeNull();
    expect(fs.existsSync(expoSource(tmp, 'ExpoMultiA'))).toBe(false);
    expect(fs.existsSync(path.join(expoSource(tmp, 'ExpoSwift'), 'Package.swift'))).toBe(true);
    expect(fs.existsSync(expoSource(tmp, 'ExpoOther'))).toBe(true);
  });

  it('is removed when it is a link to a checked-in manifest, and the module stays', () => {
    const tmp = makeTempDir('expo-spm-pattern-orphan-direct-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const moduleRoot = path.join(tmp, 'expo-multi');
    const podspecDir = pureSwiftModule(moduleRoot, 'ExpoMultiA', spec());
    fs.writeFileSync(path.join(moduleRoot, 'Package.swift'), '// swift-tools-version: 6.0\n');
    runDumpPackage.mockReturnValue(
      dumpedManifest('expo-multi', 'ExpoMultiA', { onCoreHeaders: true })
    );
    resolveExpoModules.mockReturnValue({
      ...modulesOf([
        coreAt(core),
        [
          'expo-multi',
          [
            ['ExpoMultiA', podspecDir],
            ['ExpoMultiB', podspecDir],
          ],
        ],
      ]),
      buildFromSource: ['.*'],
    });
    hasPrecompiledArtifact.mockReturnValue(true);
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) => ({
      id: frameworkName,
      frameworkName,
    }));
    const link = path.join(tmp, 'out', 'expo', 'direct', 'expo-multi');
    emitDirectPackage.mockImplementation(() => {
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(moduleRoot, link);
      return {
        ok: {
          packageDep: { name: 'expo-multi', path: link },
          productDeps: [{ name: 'ExpoMultiA', package: 'expo-multi' }],
          spmProductNames: [],
          partlyProvidedPackages: [],
        },
      };
    });
    providerWrittenTo(path.join(tmp, 'out'));
    const thrown = thrownBy(() => runPlugin(tmp));
    expect(thrown).toBeNull();
    expect(emitDirectPackage).toHaveBeenCalled();
    expect(() => fs.lstatSync(link)).toThrow();
    expect(fs.existsSync(path.join(moduleRoot, 'Package.swift'))).toBe(true);
  });
});

// A pod is one pod whichever package lists it: buildFromSource naming any of them decides.
describe.each([
  ['the named package first', ['alias-one', 'alias-two']],
  ['the named package second', ['alias-two', 'alias-one']],
])('a pod two packages list, buildFromSource naming one of them, %s', (_, packageNames) => {
  const logs = captureConsole({ each: true });

  afterEach(restoreModuleMocks);

  const sync = (sources) =>
    syncWithoutManifest(makeTempDir('expo-spm-forced-alias-'), {
      sources,
      precompiled: true,
      buildFromSource: ['alias-one'],
      packageNames,
    });

  it('is built from source, not linked precompiled through the other package', () => {
    const { thrown, frameworks } = sync('pure-swift');
    expect(thrown).toBeNull();
    expect(frameworks).toEqual(['ExpoModulesCore']);
    expect(resolveFlavoredFramework).not.toHaveBeenCalledWith(
      expect.objectContaining({ frameworkName: 'ExpoMixed' })
    );
    expect(printed(logs.log)).toContain('source pure-Swift (1): ExpoMixed');
  });

  it('is refused for buildFromSource when it cannot be built from source', () => {
    const { thrown } = sync('mixed');
    expect(thrown?.unsupported).toEqual([
      expect.objectContaining({
        reason: 'build-from-source-unsupported',
        podName: 'ExpoMixed',
        buildFromSourceEntry: 'alias-one',
        cause: expect.objectContaining({ reason: 'mixed-no-manifest' }),
      }),
    ]);
  });

  it('is refused for an entry naming one package exactly, though a pattern matches the other', () => {
    const { thrown } = syncWithoutManifest(makeTempDir('expo-spm-forced-alias-'), {
      sources: 'mixed',
      precompiled: true,
      buildFromSource: ['alias-t.*', 'alias-one'],
      packageNames,
    });
    expect(thrown?.unsupported).toEqual([
      expect.objectContaining({
        reason: 'build-from-source-unsupported',
        podName: 'ExpoMixed',
        buildFromSourceEntry: 'alias-one',
      }),
    ]);
  });
});

describe('a buildFromSource entry matching ExpoModulesCore', () => {
  const logs = captureConsole({ each: true });

  afterAll(restoreModuleMocks);

  function sync(buildFromSource) {
    const tmp = makeTempDir('expo-spm-forced-core-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    resolveExpoModules.mockReturnValue({ ...modulesOf([coreAt(core)]), buildFromSource });
    resolveFlavoredFramework.mockClear();
    providerWrittenTo(path.join(tmp, 'out'));
    let result = null;
    const thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
    return { thrown, result };
  }

  it.each([
    ['its pod name', 'ExpoModulesCore', ['ExpoModulesCore']],
    ['its npm package name', 'expo-modules-core', ['expo-modules-core']],
    [
      'its name, beside a pattern matching it',
      'expo-modules-core',
      ['Expo.*', 'expo-modules-core'],
    ],
  ])('fails the sync up front when it names %s', (_, entry, buildFromSource) => {
    const { thrown } = sync(buildFromSource);
    expect(thrown).not.toBeInstanceOf(UnsupportedModulesError);
    expect(thrown?.message).toBe(
      `[expo-spm-plugin] The buildFromSource entry "${entry}" in your app's Expo autolinking options matches ExpoModulesCore (expo-modules-core), which Swift Package Manager cannot build from source. ` +
        'Under Swift Package Manager, ExpoModulesCore is always linked precompiled: every Expo module built from source compiles against its precompiled interface. ' +
        `Remove "${entry}" from \`"expo": { "autolinking": { "buildFromSource": [...] } }\` (or its \`"ios"\` section) in your package.json, or narrow it so it no longer matches ExpoModulesCore or expo-modules-core. ${rerunSpmUpdate}`
    );
    expect(resolveFlavoredFramework).not.toHaveBeenCalled();
  });

  it('links it precompiled when only a pattern matches it, and says so', () => {
    const { thrown, result } = sync(['Expo.*']);
    expect(thrown).toBeNull();
    expect(result.flavoredFrameworks).toEqual([
      expect.objectContaining({ name: 'ExpoModulesCore' }),
    ]);
    expect(fallbackWarnings(logs)).toEqual([
      renderBuildFromSourceFallbackWarning([coreFallback('Expo.*')]),
    ]);
  });
});

// A refused manifest links no pod, so the second package listing its root reaches it again.
describe.each([
  ['through one path', false],
  ['through two symlinks', true],
])('a refused checked-in manifest two packages list %s', (_, symlinked) => {
  captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-dump-once-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const shared = path.join(tmp, 'shared');
    pureSwiftModule(shared, 'ExpoVendored', spec());
    fs.writeFileSync(path.join(shared, 'Package.swift'), '// swift-tools-version: 6.0\n');
    const listedRoot = (name) => {
      if (!symlinked) return shared;
      const link = path.join(tmp, name);
      fs.symlinkSync(shared, link);
      return link;
    };
    const podspecDirOne = path.join(listedRoot('link-one'), 'ios');
    const podspecDirTwo = path.join(listedRoot('link-two'), 'ios');
    runDumpPackage.mockReset();
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
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['alias-one', [['ExpoVendored', podspecDirOne]]],
        ['alias-two', [['ExpoVendored', podspecDirTwo]]],
      ])
    );
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(() => {
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  it('evaluates the manifest once', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(runDumpPackage).toHaveBeenCalledTimes(1);
  });
});

describe('where precompiled modules and headers come from', () => {
  const logs = captureConsole({ each: true });
  const packageOf = {
    ExpoModulesCore: 'expo-modules-core',
    ExpoModulesJSI: 'expo-modules-jsi',
    ExpoFont: 'expo-font',
  };
  const sourceAt = (kind, frameworkName) => ({
    kind,
    dir: path.join('/', kind, packageOf[frameworkName], 'output'),
  });
  const jsiHeadersXCFramework = '/abs/ExpoModulesJSIHeaders.xcframework';

  afterEach(() => {
    emitDirectPackage.mockReset();
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  /**
   * Syncs an app with expo-modules-jsi autolinked, the `frameworks` precompiled from the
   * given kinds of place, and a direct module when `headers` says where the
   * ExpoModulesCore headers come from (null for headers that are not found).
   */
  function sync({ frameworks, headers }) {
    const tmp = makeTempDir('expo-spm-plugin-sources-');
    const listed = Object.keys({ ...frameworks, ExpoModulesJSI: null }).map((frameworkName) => [
      packageOf[frameworkName],
      [
        [
          frameworkName,
          pureSwiftModule(path.join(tmp, packageOf[frameworkName]), frameworkName, spec()),
        ],
      ],
    ]);
    if (headers != null) {
      const haptics = path.join(tmp, 'expo-haptics');
      const podspecDir = pureSwiftModule(haptics, 'ExpoHaptics', spec());
      fs.writeFileSync(path.join(haptics, 'Package.swift'), '// swift-tools-version: 6.0\n');
      runDumpPackage.mockReturnValue(
        dumpedManifest('expo-haptics', 'ExpoHaptics', { onCoreHeaders: true })
      );
      listed.push(['expo-haptics', [['ExpoHaptics', podspecDir]]]);
      resolveHeadersXCFrameworkWithSource.mockImplementation(({ productName }) =>
        headers[productName] == null
          ? null
          : {
              xcframework: `/abs/${productName}Headers.xcframework`,
              source: sourceAt(headers[productName], productName),
            }
      );
      emitDirectPackage.mockReturnValue({
        ok: {
          packageDep: { name: 'ExpoHaptics', path: haptics },
          productDeps: [{ name: 'ExpoHaptics', package: 'ExpoHaptics' }],
          spmProductNames: [],
          partlyProvidedPackages: [],
        },
      });
    }
    resolveExpoModules.mockReturnValue(modulesOf(listed));
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName in frameworks ? { id: frameworkName, frameworkName } : null
    );
    frameworkSource.mockImplementation(({ frameworkName }) =>
      sourceAt(frameworks[frameworkName], frameworkName)
    );
    resolveHeadersXCFramework.mockReturnValue(jsiHeadersXCFramework);
    const outDir = path.join(tmp, 'out');
    providerWrittenTo(outDir);
    let result = null;
    const thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
    return {
      thrown,
      result,
      jsiHeadersPkgPath: path.join(outDir, 'expo', 'ExpoModulesJSIHeaders'),
    };
  }

  it('warns, and syncs, when a precompiled module comes from a different place than ExpoModulesCore', () => {
    const { thrown, result } = sync({
      frameworks: { ExpoModulesCore: 'env', ExpoFont: 'bundled' },
    });
    expect(thrown).toBeNull();
    expect(result.flavoredFrameworks).toHaveLength(2);
    const warning = printed(logs.warn);
    expect(warning).toContain('[expo-spm-plugin] WARNING: ExpoFont (expo-font)');
    expect(warning).toContain(sourceAt('bundled', 'ExpoFont').dir);
    expect(warning).toContain(sourceAt('env', 'ExpoModulesCore').dir);
    expect(warning).toContain('EXPO_PRECOMPILED_MODULES_PATH');
    expect(warning).toContain('can crash the app');
    expect(warning).toContain(rerunSpmUpdate);
    expect(warning).toContain(
      'from the Expo repository root, build the packages into the same place as ExpoModulesCore with `node tools/bin/expotools.js prebuild expo-font`'
    );
  });

  it('warns, and emits the direct module, when another precompiled module comes from a different place', () => {
    const { thrown } = sync({
      frameworks: { ExpoModulesCore: 'env', ExpoFont: 'bundled' },
      headers: { ExpoModulesCore: 'env' },
    });
    expect(thrown).toBeNull();
    expect(printed(logs.warn)).toContain('[expo-spm-plugin] WARNING: ExpoFont (expo-font)');
    expect(emitDirectPackage).toHaveBeenCalled();
  });

  it('does not warn when every precompiled module comes from the place ExpoModulesCore comes from', () => {
    const { thrown } = sync({
      frameworks: { ExpoModulesCore: 'env', ExpoFont: 'env' },
      headers: { ExpoModulesCore: 'env' },
    });
    expect(thrown).toBeNull();
    expect(printed(logs.warn)).not.toContain('comes from');
  });

  it('never requires an ExpoModulesJSI binary from the place ExpoModulesCore comes from', () => {
    const { thrown, result } = sync({
      frameworks: { ExpoModulesCore: 'monorepo', ExpoModulesJSI: 'env', ExpoFont: 'monorepo' },
    });
    expect(thrown).toBeNull();
    expect(result.flavoredFrameworks.map((f) => f.frameworkName)).toEqual([
      'ExpoFont',
      'ExpoModulesCore',
    ]);
  });

  it('accepts modules from different directories of the same kind of place', () => {
    const { thrown, result } = sync({
      frameworks: { ExpoModulesCore: 'bundled', ExpoFont: 'bundled' },
    });
    expect(thrown).toBeNull();
    expect(result.flavoredFrameworks).toHaveLength(2);
  });

  it.each([
    ['bundled', 'env'],
    ['bundled', 'monorepo'],
    ['monorepo', 'env'],
  ])(
    'fails when ExpoModulesCore comes from %s and its headers from %s, a place tried before it',
    (coreKind, headersKind) => {
      const { thrown } = sync({
        frameworks: { ExpoModulesCore: coreKind },
        headers: { ExpoModulesCore: headersKind },
      });
      expect(thrown?.message).toContain('ExpoModulesCoreHeaders.xcframework (expo-modules-core)');
      expect(thrown.message).toContain(sourceAt(headersKind, 'ExpoModulesCore').dir);
      expect(thrown.message).toContain(sourceAt(coreKind, 'ExpoModulesCore').dir);
      expect(emitDirectPackage).not.toHaveBeenCalled();
    }
  );

  const prebuildCoreHint =
    'From the Expo repository root, run `node tools/bin/expotools.js prebuild expo-modules-core expo-modules-jsi`';

  // The lookup tries EXPO_PRECOMPILED_MODULES_PATH, then the monorepo, then npm, so headers
  // found past the place ExpoModulesCore comes from mean that place has none.
  it.each([
    ['env', 'monorepo'],
    ['env', 'bundled'],
    ['env', null],
    ['monorepo', 'bundled'],
    ['monorepo', null],
  ])(
    'fails naming the missing headers when ExpoModulesCore comes from %s and its headers from %s',
    (coreKind, headersKind) => {
      const { thrown } = sync({
        frameworks: { ExpoModulesCore: coreKind },
        headers: { ExpoModulesCore: headersKind },
      });
      const coreDir = sourceAt(coreKind, 'ExpoModulesCore').dir;
      expect(thrown?.message).toContain(
        `ExpoModulesCoreHeaders.xcframework is missing under ${coreDir}`
      );
      expect(thrown.message).not.toContain('but ExpoModulesCore comes from');
      expect(thrown.message).toContain(rerunSpmUpdate);
      // The prebuild writes to the monorepo output, never to EXPO_PRECOMPILED_MODULES_PATH.
      if (coreKind === 'env') {
        expect(thrown.message).toContain('Unset EXPO_PRECOMPILED_MODULES_PATH');
        expect(thrown.message).not.toContain(prebuildCoreHint);
      } else {
        expect(thrown.message).toContain(prebuildCoreHint);
        expect(thrown.message).not.toContain('EXPO_PRECOMPILED_MODULES_PATH');
      }
      expect(emitDirectPackage).not.toHaveBeenCalled();
    }
  );

  it('hands a direct module the ExpoModulesCore headers and the ExpoModulesJSI headers package', () => {
    const { thrown, jsiHeadersPkgPath } = sync({
      frameworks: { ExpoModulesCore: 'env' },
      headers: { ExpoModulesCore: 'env' },
    });
    expect(thrown).toBeNull();
    expect(emitDirectPackage).toHaveBeenCalledWith(
      expect.objectContaining({
        coreHeadersXCFramework: '/abs/ExpoModulesCoreHeaders.xcframework',
        jsiHeadersPkgPath,
      })
    );
    expect(resolveHeadersXCFrameworkWithSource).not.toHaveBeenCalledWith(
      expect.objectContaining({ productName: 'ExpoModulesJSI' })
    );
  });

  it('emits the ExpoModulesJSI headers package when the only source package is a direct one', () => {
    emitPureSwiftSourcePackage.mockClear();
    const { thrown, jsiHeadersPkgPath } = sync({
      frameworks: { ExpoModulesCore: 'env' },
      headers: { ExpoModulesCore: 'env' },
    });
    expect(thrown).toBeNull();
    expect(emitPureSwiftSourcePackage).not.toHaveBeenCalled();
    expect(fs.readlinkSync(path.join(jsiHeadersPkgPath, 'ExpoModulesJSIHeaders.xcframework'))).toBe(
      jsiHeadersXCFramework
    );
    expect(fs.existsSync(path.join(jsiHeadersPkgPath, 'Package.swift'))).toBe(true);
  });

  // A broken copy further down the lookup is not what the user has to fix: reinstalling or
  // rebuilding it cannot repair an EXPO_PRECOMPILED_MODULES_PATH build without headers.
  it('names the missing headers, not an incomplete npm copy, when ExpoModulesCore comes from EXPO_PRECOMPILED_MODULES_PATH', () => {
    const tmp = makeTempDir('expo-spm-plugin-env-headers-');
    const envDir = path.join(tmp, 'precompiled');
    fs.mkdirSync(envDir);
    const coreRoot = path.join(tmp, 'expo-modules-core');
    const corePodspecDir = pureSwiftModule(coreRoot, 'ExpoModulesCore', spec());
    fs.mkdirSync(
      path.join(
        coreRoot,
        'prebuilds',
        'output',
        'headers',
        'xcframeworks',
        'ExpoModulesCoreHeaders.xcframework'
      ),
      { recursive: true }
    );
    const jsiPodspecDir = pureSwiftModule(
      path.join(tmp, 'expo-modules-jsi'),
      'ExpoModulesJSI',
      spec()
    );
    const haptics = path.join(tmp, 'expo-haptics');
    const hapticsPodspecDir = pureSwiftModule(haptics, 'ExpoHaptics', spec());
    fs.writeFileSync(path.join(haptics, 'Package.swift'), '// swift-tools-version: 6.0\n');
    runDumpPackage.mockReturnValue(
      dumpedManifest('expo-haptics', 'ExpoHaptics', { onCoreHeaders: true })
    );
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(corePodspecDir),
        ['expo-modules-jsi', [['ExpoModulesJSI', jsiPodspecDir]]],
        ['expo-haptics', [['ExpoHaptics', hapticsPodspecDir]]],
      ])
    );
    const coreDir = path.join(envDir, 'expo-modules-core', 'output');
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' ? { id: frameworkName, frameworkName } : null
    );
    frameworkSource.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' ? { kind: 'env', dir: coreDir } : null
    );
    resolveHeadersXCFramework.mockReturnValue(jsiHeadersXCFramework);
    resolveHeadersXCFrameworkWithSource.mockImplementation(
      jest.requireActual('../flavored-frameworks').resolveHeadersXCFrameworkWithSource
    );
    providerWrittenTo(path.join(tmp, 'out'));
    const previous = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = envDir;
    try {
      const thrown = thrownBy(() => runPlugin(tmp));
      expect(thrown?.message).toContain(
        `ExpoModulesCoreHeaders.xcframework is missing under ${coreDir}`
      );
      expect(thrown.message).toContain('Unset EXPO_PRECOMPILED_MODULES_PATH');
      expect(thrown.message).not.toContain('Info.plist');
      expect(emitDirectPackage).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
      } else {
        process.env.EXPO_PRECOMPILED_MODULES_PATH = previous;
      }
    }
  });

  it('fails when a direct module exists and the ExpoModulesCore headers are missing', () => {
    const previous = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = '/precompiled';
    try {
      const { thrown } = sync({
        frameworks: { ExpoModulesCore: 'bundled' },
        headers: { ExpoModulesCore: null },
      });
      expect(thrown?.message).toContain('ExpoModulesCoreHeaders.xcframework');
      const { headersXCFrameworkSearchPaths } = jest.requireActual('../flavored-frameworks');
      const searched = headersXCFrameworkSearchPaths({
        packageName: 'expo-modules-core',
        moduleRoot: null,
        productName: 'ExpoModulesCore',
      });
      expect(searched.length).toBeGreaterThan(0);
      for (const candidate of searched) expect(thrown.message).toContain(candidate);
      expect(thrown.message).toContain(
        'From the Expo repository root, run `node tools/bin/expotools.js prebuild expo-modules-core`'
      );
      expect(thrown.message).toContain(rerunSpmUpdate);
      expect(emitDirectPackage).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
      } else {
        process.env.EXPO_PRECOMPILED_MODULES_PATH = previous;
      }
    }
  });

  it('looks for no headers when no direct module is emitted', () => {
    resolveHeadersXCFrameworkWithSource.mockClear();
    const { thrown } = sync({ frameworks: { ExpoModulesCore: 'env', ExpoFont: 'env' } });
    expect(thrown).toBeNull();
    expect(resolveHeadersXCFrameworkWithSource).not.toHaveBeenCalled();
  });
});

describe.each([
  ['a checked-in manifest', 'ExpoDual'],
  ['a checked-in manifest', 'ExpoDualExtras'],
  ['pure-Swift sources', 'ExpoDual'],
  ['pure-Swift sources', 'ExpoDualExtras'],
])('a two-pod module with %s whose only precompiled pod is %s', (kind, precompiledPod) => {
  const sourcePod = precompiledPod === 'ExpoDual' ? 'ExpoDualExtras' : 'ExpoDual';
  const logs = captureConsole();
  let outDir;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-plugin-partial-');
    outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const dual = path.join(tmp, 'expo-dual');
    const dualPodspecDir = pureSwiftModule(dual, 'ExpoDual', spec());
    fs.writeFileSync(path.join(dualPodspecDir, 'ExpoDualExtras.podspec'), spec());
    if (kind === 'a checked-in manifest') {
      fs.writeFileSync(path.join(dual, 'Package.swift'), '// swift-tools-version: 6.0\n');
      runDumpPackage.mockReturnValue(
        JSON.stringify({
          name: 'ExpoDual',
          products: [{ name: 'ExpoDual', type: { library: ['automatic'] }, targets: ['ExpoDual'] }],
          targets: [{ name: 'ExpoDual', type: 'regular', path: 'ios', dependencies: [] }],
        })
      );
    }
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      ['ExpoModulesCore', precompiledPod].includes(frameworkName)
        ? { id: frameworkName, frameworkName }
        : null
    );
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-dual',
          [
            ['ExpoDual', dualPodspecDir],
            ['ExpoDualExtras', dualPodspecDir],
          ],
        ],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync for the pod that is not precompiled, naming the one that is', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'partially-precompiled',
        podName: sourcePod,
        packageName: 'expo-dual',
        precompiledSiblings: [precompiledPod],
      }),
    ]);
    expect(printed(logs.error)).toContain(`error: Expo module "expo-dual" (pod ${sourcePod})`);
  });

  it('emits no source package for the module, so the precompiled pod is linked once', () => {
    expect(fs.existsSync(path.join(outDir, 'expo', 'expo-source', 'ExpoDual'))).toBe(false);
  });
});

describe('a partially precompiled module', () => {
  const logs = captureConsole({ each: true });

  afterEach(restoreModuleMocks);

  function syncPartialModule({ sources, pods, precompiled }) {
    const tmp = makeTempDir('expo-spm-plugin-partial-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const moduleRoot = path.join(tmp, 'expo-dual');
    const podspecDir = pureSwiftModule(moduleRoot, pods[0], spec());
    for (const podName of pods.slice(1)) {
      fs.writeFileSync(path.join(podspecDir, `${podName}.podspec`), spec());
    }
    if (sources !== 'swift') {
      fs.writeFileSync(path.join(podspecDir, 'B.m'), '// objc\n');
    }
    if (sources === 'mixed with a manifest') {
      fs.writeFileSync(path.join(moduleRoot, 'Package.swift'), '// swift-tools-version: 6.0\n');
      runDumpPackage.mockReturnValue(
        JSON.stringify({
          name: 'ExpoDual',
          products: [{ name: 'ExpoDual', type: { library: ['automatic'] }, targets: ['ExpoDual'] }],
          targets: [{ name: 'ExpoDual', type: 'regular', path: 'ios', dependencies: [] }],
        })
      );
    }
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      ['ExpoModulesCore', ...precompiled].includes(frameworkName)
        ? { id: frameworkName, frameworkName }
        : null
    );
    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-dual', pods.map((podName) => [podName, podspecDir])]])
    );
    const thrown = thrownBy(() => runPlugin(tmp));
    const sourceDir = path.join(outDir, 'expo', 'expo-source');
    return {
      thrown,
      report: printed(logs.error),
      moduleRoot,
      sourcePackages: fs.existsSync(sourceDir) ? fs.readdirSync(sourceDir) : [],
    };
  }

  it('is refused when a checked-in manifest covers mixed-language sources', () => {
    const { thrown, sourcePackages } = syncPartialModule({
      sources: 'mixed with a manifest',
      pods: ['ExpoDual', 'ExpoDualExtras'],
      precompiled: ['ExpoDual'],
    });
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({ reason: 'partially-precompiled', podName: 'ExpoDualExtras' }),
    ]);
    expect(sourcePackages).toEqual([]);
  });

  it('keeps the mixed-language report when it has no manifest, since it is never built from source', () => {
    const { thrown, sourcePackages } = syncPartialModule({
      sources: 'mixed',
      pods: ['ExpoDual', 'ExpoDualExtras'],
      precompiled: ['ExpoDual'],
    });
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({ reason: 'mixed-no-manifest', podName: 'ExpoDualExtras' }),
    ]);
    expect(sourcePackages).toEqual([]);
  });

  it('reports every pod that is not precompiled', () => {
    const { thrown } = syncPartialModule({
      sources: 'swift',
      pods: ['ExpoDual', 'ExpoDualExtras', 'ExpoDualKit', 'ExpoDualUI'],
      precompiled: ['ExpoDual', 'ExpoDualKit'],
    });
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'partially-precompiled',
        podName: 'ExpoDualExtras',
        precompiledSiblings: ['ExpoDual', 'ExpoDualKit'],
      }),
      expect.objectContaining({
        reason: 'partially-precompiled',
        podName: 'ExpoDualUI',
        precompiledSiblings: ['ExpoDual', 'ExpoDualKit'],
      }),
    ]);
  });

  it('names every directory the artifact resolver searches, in its order', () => {
    const previous = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = '/precompiled';
    try {
      const { report, moduleRoot } = syncPartialModule({
        sources: 'swift',
        pods: ['ExpoDual', 'ExpoDualExtras'],
        precompiled: ['ExpoDual'],
      });
      const searched = artifactBaseDirs('expo-dual', moduleRoot);
      expect(searched).toHaveLength(3);
      const positions = searched.map((dir) => report.indexOf(dir));
      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
      } else {
        process.env.EXPO_PRECOMPILED_MODULES_PATH = previous;
      }
    }
  });
});

describe('a partially precompiled module whose precompiled product is not named after its pod', () => {
  const logs = captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-plugin-partial-product-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const skia = path.join(tmp, 'react-native-skia');
    const podspecDir = pureSwiftModule(skia, 'RNSkiaPod', spec());
    fs.writeFileSync(path.join(podspecDir, 'RNSkiaExtras.podspec'), spec());
    prebuiltMetadata.mockReturnValue({ RNSkiaPod: metadataEntry(skia, 'RNSkia') });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      ['ExpoModulesCore', 'RNSkia'].includes(frameworkName)
        ? { id: frameworkName, frameworkName }
        : null
    );
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'react-native-skia',
          [
            ['RNSkiaPod', podspecDir],
            ['RNSkiaExtras', podspecDir],
          ],
        ],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('names the artifacts pass 1 looked up, under the product name', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    const report = printed(logs.error);
    expect(report).toContain('— RNSkia.xcframework or RNSkia.tar.gz, under');
    expect(report).not.toContain('RNSkiaPod.xcframework');
    expect(report).toContain('its sibling pod RNSkiaPod does');
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

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-documented', [['ExpoDocumented', podspecDirs.documented]]],
        ['expo-autolinked', [['ExpoAutolinked', podspecDirs.autolinked]]],
        ['expo-fallback', [['ExpoFallback', podspecDirs.fallback]]],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoDocumented: metadataEntry(roots.documented, 'ExpoDocumented'),
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

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-walked', [['ExpoWalked', podspecDir]]]])
    );
    resolveFlavoredFramework.mockClear();
    findModuleRoot.mockClear();
    providerWrittenTo(path.join(tmp, 'out'));
    runPlugin(tmp, { autolinking: {} });
  });

  afterAll(restoreModuleMocks);

  it('resolves every module root by walking the filesystem', () => {
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

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-linked', [['ExpoLinked', podspecDirs.linked]]],
        ['expo-duplicated', [['ExpoDuplicated', podspecDirs.duplicated]]],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoLinked: metadataEntry(roots.linked, 'ExpoLinked'),
      ExpoDuplicated: metadataEntry(roots.duplicated, 'ExpoDuplicated'),
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
  let thrown;

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

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-multi',
          [
            ['ExpoMultiA', podspecDir],
            ['ExpoMultiB', podspecDir],
          ],
        ],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoMultiA: metadataEntry(roots.multi, 'ExpoMultiA'),
      ExpoMultiB: metadataEntry(roots.multiCopy, 'ExpoMultiB'),
    });
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() =>
      runPlugin(tmp, { autolinking: { dependencies: { 'expo-multi': { root: roots.multi } } } })
    );
  });

  afterAll(restoreModuleMocks);

  // The first pod agrees with the autolinked root; only the second one does not.
  it('warns about the copy its second pod builds from', () => {
    expect(printed(logs.warn)).toContain('Expo module "expo-multi" is installed twice');
    expect(printed(logs.warn).match(/is installed twice/g)).toHaveLength(1);
    expect(printed(logs.warn)).toContain(roots.multiCopy);
  });

  it('fails the sync on the second pod, which nothing emits', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported.map((u) => u.podName)).toEqual(['ExpoMultiB']);
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
    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-extra', [['ExpoExtra', podspecDir]]]], extraDependencies)
    );
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

// A source-emitted module has no XCFramework to link its SwiftPM dependencies
// into, so the generated manifest has to declare them itself.
describe('the SwiftPM packages a source-emitted module declares', () => {
  const logs = captureConsole();
  let manifest;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-source-deps-plugin-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const imageRoot = path.join(tmp, 'expo-image');
    const image = pureSwiftModule(
      imageRoot,
      'ExpoImage',
      spec(
        "  s.dependency 'ExpoModulesCore'",
        "  s.dependency 'SDWebImage'",
        "  s.dependency 'libavif/libdav1d'",
        "  s.dependency 'SomeUnmappedPod'"
      )
    );

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-image', [['ExpoImage', image]]]])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoImage: {
        packageRoot: imageRoot,
        productName: 'ExpoImage',
        sourceOnly: true,
        spmPackages: [
          {
            url: 'https://github.com/SDWebImage/SDWebImage.git',
            productName: 'SDWebImage',
            version: { exact: '5.21.6' },
          },
          {
            url: 'https://github.com/SDWebImage/libavif-Xcode.git',
            productName: 'libavif',
            version: { exact: '1.0.0' },
          },
        ],
      },
    });
    providerWrittenTo(outDir);
    runPlugin(tmp);
    manifest = fs.readFileSync(
      path.join(outDir, 'expo', 'expo-source', 'ExpoImage', 'Package.swift'),
      'utf8'
    );
  });

  afterAll(restoreModuleMocks);

  it('declares them in the generated manifest', () => {
    expect(manifest).toContain(
      '.package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),'
    );
    expect(manifest).toContain(
      '.package(url: "https://github.com/SDWebImage/libavif-Xcode.git", exact: "1.0.0"),'
    );
    expect(manifest).toContain('.product(name: "SDWebImage", package: "SDWebImage"),');
    expect(manifest).toContain('.product(name: "libavif", package: "libavif-Xcode"),');
  });

  it('counts them as counterparts of the pods its podspec depends on', () => {
    const report = printed(logs.warn);
    expect(report).toContain('warning: Expo module "expo-image" (pod ExpoImage)');
    expect(report).toContain('SomeUnmappedPod');
    expect(report).not.toContain('SDWebImage');
    // Root-name match, as CocoaPods; SwiftPM's libavif is libaom, not dav1d (no upstream fix).
    expect(report).not.toContain('libavif');
  });
});

describe('a source-emitted module depending on a package a precompiled module links', () => {
  captureConsole();
  let manifest;
  let result;
  let compiled;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-satisfied-deps-plugin-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const imageRoot = path.join(tmp, 'expo-image');
    const imagePodspecDir = mixedModule(imageRoot, 'ExpoImage');
    const fooRoot = path.join(tmp, 'expo-foo');
    const foo = pureSwiftModule(fooRoot, 'ExpoFoo', spec("  s.dependency 'ExpoModulesCore'"));
    const sdWebImage = {
      url: 'https://github.com/SDWebImage/SDWebImage.git',
      productName: 'SDWebImage',
      version: { exact: '5.21.6' },
    };
    const libavif = {
      url: 'https://github.com/SDWebImage/libavif-Xcode.git',
      productName: 'libavif',
      version: { exact: '1.0.0' },
    };

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-image', [['ExpoImage', imagePodspecDir]]],
        ['expo-foo', [['ExpoFoo', foo]]],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoImage: { packageRoot: imageRoot, productName: 'ExpoImage', spmPackages: [sdWebImage] },
      ExpoFoo: {
        packageRoot: fooRoot,
        productName: 'ExpoFoo',
        sourceOnly: true,
        spmPackages: [sdWebImage, libavif],
      },
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'ExpoImage'
        ? { id: frameworkName === 'ExpoImage' ? 'expo-image' : 'expo-modules-core', frameworkName }
        : null
    );
    resolveSpmDependencyFrameworks.mockReturnValue([
      {
        id: 'expo-sd-web-image',
        frameworkName: 'SDWebImage',
        linkage: 'dynamic',
        flavors: {
          debug: '/abs/debug/SDWebImage.xcframework',
          release: '/abs/release/SDWebImage.xcframework',
        },
      },
    ]);
    prepareCompileInterfaces.mockImplementation((frameworks) => {
      compiled = frameworks.map((framework) => framework.frameworkName);
      return '/abs/interfaces';
    });
    providerWrittenTo(outDir);
    result = runPlugin(tmp);
    manifest = fs.readFileSync(
      path.join(outDir, 'expo', 'expo-source', 'ExpoFoo', 'Package.swift'),
      'utf8'
    );
  });

  afterAll(restoreModuleMocks);

  it('links the precompiled framework instead of declaring a second copy', () => {
    expect(manifest).not.toContain('SDWebImage.git');
    expect(manifest).not.toContain('.product(name: "SDWebImage"');
    expect(result.flavoredFrameworks).toContainEqual(
      expect.objectContaining({ frameworkName: 'SDWebImage' })
    );
    expect(compiled).toContain('SDWebImage');
    expect(manifest).toContain('cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],');
    expect(manifest).toContain('swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces",');
  });

  it('still declares the packages nothing precompiled provides', () => {
    expect(manifest).toContain(
      '.package(url: "https://github.com/SDWebImage/libavif-Xcode.git", exact: "1.0.0"),'
    );
    expect(manifest).toContain('.product(name: "libavif", package: "libavif-Xcode"),');
  });
});

// A kept product can depend on the provided one inside its package, which the plugin
// cannot see, so the sync warns instead of failing.
describe('a source-emitted module keeping a package whose other product is precompiled', () => {
  const logs = captureConsole();

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-partly-provided-plugin-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const imageRoot = path.join(tmp, 'expo-image');
    const imagePodspecDir = mixedModule(imageRoot, 'ExpoImage');
    const mapsRoot = path.join(tmp, 'expo-maps-extra');
    const maps = pureSwiftModule(
      mapsRoot,
      'ExpoMapsExtra',
      spec("  s.dependency 'ExpoModulesCore'")
    );
    fs.writeFileSync(
      path.join(mapsRoot, 'Package.swift'),
      '// swift-tools-version: 6.0\n// checked in by the module\n'
    );
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'ExpoMapsExtra',
        dependencies: [
          {
            sourceControl: [
              {
                identity: 'sdwebimage',
                location: {
                  remote: [{ urlString: 'https://github.com/SDWebImage/SDWebImage.git' }],
                },
                productFilter: null,
                requirement: { exact: ['5.21.6'] },
              },
            ],
          },
        ],
        products: [
          { name: 'ExpoMapsExtra', type: { library: ['automatic'] }, targets: ['ExpoMapsExtra'] },
        ],
        targets: [
          {
            name: 'ExpoMapsExtra',
            type: 'regular',
            path: 'ios',
            dependencies: [
              { product: ['SDWebImage', 'SDWebImage', null, null] },
              { product: ['SDWebImageMapKit', 'SDWebImage', null, null] },
              { byName: ['SDWebImage', null] },
            ],
          },
        ],
      })
    );

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-image', [['ExpoImage', imagePodspecDir]]],
        ['expo-maps-extra', [['ExpoMapsExtra', maps]]],
      ])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoImage: {
        packageRoot: imageRoot,
        productName: 'ExpoImage',
        spmPackages: [
          {
            url: 'https://github.com/SDWebImage/SDWebImage.git',
            productName: 'SDWebImage',
            version: { exact: '5.21.6' },
          },
        ],
      },
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || frameworkName === 'ExpoImage'
        ? { id: frameworkName === 'ExpoImage' ? 'expo-image' : 'expo-modules-core', frameworkName }
        : null
    );
    resolveSpmDependencyFrameworks.mockReturnValue([
      { id: 'expo-sd-web-image', frameworkName: 'SDWebImage' },
    ]);
    providerWrittenTo(outDir);
    runPlugin(tmp);
  });

  afterAll(restoreModuleMocks);

  it('warns once, naming the package and its products, and the product named without one', () => {
    const warnings = logs.warn.mock.calls
      .map(([text]) => text)
      .filter((text) => text.includes('from a precompiled framework'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(
      'Expo module "expo-maps-extra" still declares https://github.com/SDWebImage/SDWebImage.git for "SDWebImageMapKit", while "SDWebImage" comes from a precompiled framework.'
    );
    expect(warnings[0]).toContain(
      'Expo module "expo-maps-extra" names "SDWebImage" without a package'
    );
    expect(warnings[0]).toContain(
      'may still build it from https://github.com/SDWebImage/SDWebImage.git, which'
    );
  });
});

describe('a pod name two packages both list', () => {
  captureConsole();
  let result;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-duplicate-pod-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-core-copy', [['ExpoModulesCore', core]]]])
    );
    resolveFlavoredFramework.mockClear();
    providerWrittenTo(path.join(tmp, 'out'));
    result = runPlugin(tmp);
  });

  afterAll(restoreModuleMocks);

  it('is one pod, resolved and declared once', () => {
    expect(resolvedFor('expo-core-copy')).toBeUndefined();
    expect(result.flavoredFrameworks).toEqual([{ id: 'ExpoModulesCore', name: 'ExpoModulesCore' }]);
  });
});

describe('a pod name two pure-Swift packages both list first', () => {
  const logs = captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-shared-first-pod-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const first = pureSwiftModule(path.join(tmp, 'expo-first'), 'ExpoShared', spec());
    fs.writeFileSync(path.join(first, 'ExpoFirstExtra.podspec'), spec());
    const second = pureSwiftModule(path.join(tmp, 'expo-second'), 'ExpoShared', spec());
    fs.writeFileSync(path.join(second, 'ExpoSecondExtra.podspec'), spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-first',
          [
            ['ExpoShared', first],
            ['ExpoFirstExtra', first],
          ],
        ],
        [
          'expo-second',
          [
            ['ExpoShared', second],
            ['ExpoSecondExtra', second],
          ],
        ],
      ])
    );
    emitPureSwiftSourcePackage.mockClear();
    resolveFlavoredFramework.mockClear();
    prepareCompileInterfaces.mockClear();
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync on the duplicate pod name before either pass', () => {
    expect(resolveFlavoredFramework).not.toHaveBeenCalled();
    expect(prepareCompileInterfaces).not.toHaveBeenCalled();
    expect(emitPureSwiftSourcePackage).not.toHaveBeenCalled();
    expect(printed(logs.log)).not.toContain('source pure-Swift');
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoShared',
        copies: [
          expect.objectContaining({ packageName: 'expo-first' }),
          expect.objectContaining({ packageName: 'expo-second' }),
        ],
      },
    ]);
  });
});

describe('a checked-in manifest package declaring a pod another package declares', () => {
  const logs = captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-duplicate-pod-name-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = { first: path.join(tmp, 'expo-first'), second: path.join(tmp, 'expo-second') };
    const first = pureSwiftModule(roots.first, 'ExpoShared', spec());
    const second = pureSwiftModule(roots.second, 'ExpoShared', spec());
    fs.writeFileSync(path.join(second, 'ExpoSecondExtra.podspec'), spec());
    fs.writeFileSync(path.join(roots.second, 'Package.swift'), '// swift-tools-version:6.0\n');

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-first', [['ExpoShared', first]]],
        [
          'expo-second',
          [
            ['ExpoShared', second],
            ['ExpoSecondExtra', second],
          ],
        ],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync naming the pod, both packages and both module roots', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoShared',
        copies: [
          { packageName: 'expo-first', moduleRoot: roots.first },
          { packageName: 'expo-second', moduleRoot: roots.second },
        ],
      },
    ]);
    const report = printed(logs.error);
    expect(report).toContain('"expo-first"');
    expect(report).toContain(roots.first);
    expect(report).toContain(roots.second);
    expect(report).toContain('"exclude": ["expo-second"]');
  });
});

/** Precompiles ExpoModulesCore, and `frameworkName` when `packageName` looks it up. */
function precompiledFrom(packageName, frameworkName) {
  resolveFlavoredFramework.mockImplementation((args) =>
    args.frameworkName === 'ExpoModulesCore' ||
    (args.frameworkName === frameworkName && args.packageName === packageName)
      ? { id: args.frameworkName, frameworkName: args.frameworkName }
      : null
  );
}

// A fork declaring the same pod is a second copy of it; linking either one would
// silently drop the other.
describe('a fork declaring the same pod at another root', () => {
  captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-fork-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = { original: path.join(tmp, 'expo-x'), fork: path.join(tmp, 'expo-x-fork') };
    const original = pureSwiftModule(roots.original, 'ExpoX', spec());
    const fork = pureSwiftModule(roots.fork, 'ExpoX', spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-x', [['ExpoX', original]]],
        ['expo-x-fork', [['ExpoX', fork]]],
      ])
    );
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync on the duplicate pod name instead of dropping the second copy', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: 'expo-x', moduleRoot: roots.original },
          { packageName: 'expo-x-fork', moduleRoot: roots.fork },
        ],
      },
    ]);
  });
});

// The document places the pod at the SECOND package, so the first one's copy is
// built from there; only the packages' own roots tell the two copies apart.
describe('a duplicate pod name the prebuilt-metadata document places at the second package', () => {
  captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-documented-second-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = { a: path.join(tmp, 'expo-a'), b: path.join(tmp, 'expo-b') };
    const a = pureSwiftModule(roots.a, 'ExpoX', spec());
    const b = pureSwiftModule(roots.b, 'ExpoX', spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-a', [['ExpoX', a]]], ['expo-b', [['ExpoX', b]]]])
    );
    prebuiltMetadata.mockReturnValue({ ExpoX: metadataEntry(roots.b, 'ExpoX') });
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it("fails the sync, naming each package's own root", () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: 'expo-a', moduleRoot: roots.a },
          { packageName: 'expo-b', moduleRoot: roots.b },
        ],
      },
    ]);
  });
});

// Without ExpoModulesCore nothing can be linked, but keeping one copy is still
// part of the fix.
describe('a duplicate pod name in an app without ExpoModulesCore', () => {
  captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-duplicate-no-core-'));
    roots = { a: path.join(tmp, 'expo-a'), b: path.join(tmp, 'expo-b') };
    const a = pureSwiftModule(roots.a, 'ExpoX', spec());
    const b = pureSwiftModule(roots.b, 'ExpoX', spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([
        ['expo-a', [['ExpoX', a]]],
        ['expo-b', [['ExpoX', b]]],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('reports the duplicate pod name, not the missing core', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: 'expo-a', moduleRoot: roots.a },
          { packageName: 'expo-b', moduleRoot: roots.b },
        ],
      },
    ]);
  });
});

describe('a pod no pass can link, listed by two packages at one module root', () => {
  captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-unlinkable-shared-pod-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const shared = mixedModule(path.join(tmp, 'expo-m'), 'ExpoM');

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-m', [['ExpoM', shared]]],
        ['expo-m-alias', [['ExpoM', shared]]],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('reports the pod once', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported.map(({ podName, reason }) => [podName, reason])).toEqual([
      ['ExpoM', 'mixed-no-manifest'],
    ]);
  });
});

describe('two packages reaching one module root through a symlink', () => {
  captureConsole();
  let result;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-symlinked-root-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const root = path.join(tmp, 'expo-x');
    const alias = path.join(tmp, 'expo-x-alias');
    pureSwiftModule(root, 'ExpoX', spec());
    fs.symlinkSync(root, alias, 'dir');

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-x', [['ExpoX', path.join(root, 'ios')]]],
        ['expo-x-alias', [['ExpoX', path.join(alias, 'ios')]]],
      ])
    );
    emitPureSwiftSourcePackage.mockClear();
    providerWrittenTo(path.join(tmp, 'out'));
    result = runPlugin(tmp);
  });

  afterAll(restoreModuleMocks);

  it('links the pod once, without a duplicate pod name', () => {
    expect(result).toBeDefined();
    const emitted = emitPureSwiftSourcePackage.mock.calls.filter(
      ([args]) => args.product === 'ExpoX'
    );
    expect(emitted).toHaveLength(1);
  });
});

describe('two package names for one checked-in manifest, the second listing one more pod', () => {
  captureConsole();
  let result;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-manifest-aliases-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const shared = path.join(tmp, 'shared');
    const podspecDir = pureSwiftModule(shared, 'ExpoA', spec());
    fs.writeFileSync(path.join(podspecDir, 'ExpoB.podspec'), spec());
    fs.mkdirSync(path.join(podspecDir, 'b'));
    fs.writeFileSync(path.join(podspecDir, 'b', 'B.swift'), '// swift\n');
    fs.writeFileSync(path.join(shared, 'Package.swift'), '// swift-tools-version: 6.0\n');
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'ExpoShared',
        dependencies: [],
        products: [
          { name: 'ExpoA', type: { library: ['automatic'] }, targets: ['ExpoA'] },
          { name: 'ExpoB', type: { library: ['automatic'] }, targets: ['ExpoB'] },
        ],
        targets: [
          { name: 'ExpoA', type: 'regular', path: 'ios', dependencies: [] },
          { name: 'ExpoB', type: 'regular', path: 'ios/b', dependencies: [] },
        ],
      })
    );
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['alias-one', [['ExpoA', podspecDir]]],
        [
          'alias-two',
          [
            ['ExpoA', podspecDir],
            ['ExpoB', podspecDir],
          ],
        ],
      ])
    );
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
  });

  afterAll(() => {
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  it("links the second listing's pod through the manifest already emitted", () => {
    expect(thrown).toBeNull();
    expect(result.productDependencies).toContainEqual({ name: 'ExpoB', package: 'ExpoShared' });
  });

  it('declares the manifest package once', () => {
    expect(result.packageDependencies.filter((dep) => dep.name === 'ExpoShared')).toHaveLength(1);
    expect(result.productDependencies.filter((dep) => dep.name === 'ExpoB')).toHaveLength(1);
  });
});

/**
 * A checked-in manifest exporting ExpoA and ExpoB, listed by two packages: `alias-one`
 * names ExpoA alone, `alias-two` names ExpoA and `secondPod`. Returns the module root.
 */
function aliasedManifest(tmp, secondPod) {
  const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
  const shared = path.join(tmp, 'shared');
  const podspecDir = pureSwiftModule(shared, 'ExpoA', spec());
  fs.writeFileSync(path.join(podspecDir, `${secondPod}.podspec`), spec());
  fs.mkdirSync(path.join(podspecDir, 'b'));
  fs.writeFileSync(path.join(podspecDir, 'b', 'B.swift'), '// swift\n');
  fs.writeFileSync(path.join(shared, 'Package.swift'), '// swift-tools-version: 6.0\n');
  runDumpPackage.mockReturnValue(
    JSON.stringify({
      name: 'ExpoShared',
      dependencies: [],
      products: [
        { name: 'ExpoA', type: { library: ['automatic'] }, targets: ['ExpoA'] },
        { name: 'ExpoB', type: { library: ['automatic'] }, targets: ['ExpoB'] },
      ],
      targets: [
        { name: 'ExpoA', type: 'regular', path: 'ios', dependencies: [] },
        { name: 'ExpoB', type: 'regular', path: 'ios/b', dependencies: [] },
      ],
    })
  );
  resolveExpoModules.mockReturnValue(
    modulesOf([
      coreAt(core),
      ['alias-one', [['ExpoA', podspecDir]]],
      [
        'alias-two',
        [
          ['ExpoA', podspecDir],
          [secondPod, podspecDir],
        ],
      ],
    ])
  );
  providerWrittenTo(path.join(tmp, 'out'));
  return shared;
}

describe('a second package name listing a pod its checked-in manifest does not export', () => {
  const logs = captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-manifest-unexported-');
    aliasedManifest(tmp, 'ExpoC');
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(() => {
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  it('fails the sync saying the manifest does not export its product', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'not-exported-by-manifest',
        podName: 'ExpoC',
        packageName: 'alias-two',
        productName: 'ExpoC',
        exportedProducts: ['ExpoA', 'ExpoB'],
      }),
    ]);
    const report = printed(logs.error);
    expect(report).toContain('does not export "ExpoC"');
    expect(report).not.toContain('mixes Swift and Objective-C');
  });
});

describe('listings of one checked-in manifest, in every order', () => {
  captureConsole();
  const permutations = (items) =>
    items.length <= 1
      ? [items]
      : items.flatMap((item, i) =>
          permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
        );
  const outcomes = [];

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-manifest-orders-');
    aliasedManifest(tmp, 'ExpoC');
    const [core, ...listings] = resolveExpoModules().modules;
    const podspecDir = listings[0].pods[0].podspecDir;
    listings.push({ packageName: 'alias-three', pods: [{ podName: 'ExpoC', podspecDir }] });
    for (const order of permutations(listings)) {
      resolveExpoModules.mockReturnValue({ modules: [core, ...order], extraDependencies: [] });
      const thrown = thrownBy(() => runPlugin(tmp));
      outcomes.push({
        order: order.map((listing) => listing.packageName),
        refusals: thrown?.unsupported?.map(({ reason, podName }) => ({ reason, podName })),
      });
    }
  });

  afterAll(() => {
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  it('refuses the pod the manifest does not export, whichever listing emits it', () => {
    expect(outcomes).toHaveLength(6);
    for (const { order, refusals } of outcomes) {
      expect({ order, refusals }).toEqual({
        order,
        refusals: [{ reason: 'not-exported-by-manifest', podName: 'ExpoC' }],
      });
    }
  });
});

describe('a gated-off product reached through a second package name', () => {
  const logs = captureConsole();
  let result;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-manifest-alias-gated-');
    const shared = aliasedManifest(tmp, 'ExpoB');
    const appIosDir = path.join(tmp, 'app', 'ios');
    fs.mkdirSync(appIosDir, { recursive: true });
    const podfilePropertiesPath = path.join(appIosDir, 'Podfile.properties.json');
    fs.writeFileSync(podfilePropertiesPath, JSON.stringify({ 'expo.b-enabled': 'false' }));
    resolveAppTarget.mockReturnValue({
      targetName: null,
      entitlementPath: null,
      podfilePropertiesPath,
    });
    prebuiltMetadata.mockReturnValue({
      ExpoB: metadataEntry(shared, 'ExpoB', {
        autolinkWhen: { podfileProperty: 'expo.b-enabled', disabledValue: 'false' },
      }),
    });
    thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
  });

  afterAll(() => {
    runDumpPackage.mockReset();
    resolveAppTarget.mockReturnValue({
      targetName: null,
      entitlementPath: null,
      podfilePropertiesPath: null,
    });
    restoreModuleMocks();
  });

  it('withholds the product, and reports it once', () => {
    expect(thrown).toBeNull();
    expect(result.productDependencies).toEqual([{ name: 'ExpoA', package: 'ExpoShared' }]);
    expect(printed(logs.log)).toContain('gated off (1): ExpoB (expo.b-enabled)');
  });
});

// A podspec directory that is gone has no package of its own to find: the walk up
// would stop at whatever ancestor has a package.json, the same one for both.
describe('two missing packages declaring one pod name', () => {
  captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-missing-copies-'));
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"name":"app"}');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = {
      a: path.join(tmp, 'node_modules', 'pkg-a', 'ios'),
      b: path.join(tmp, 'node_modules', 'pkg-b', 'ios'),
    };

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['pkg-a', [['Foo', roots.a]]], ['pkg-b', [['Foo', roots.b]]]])
    );
    prebuiltMetadata.mockReturnValue({
      Foo: { productName: 'Foo' },
    });
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      ['ExpoModulesCore', 'Foo'].includes(frameworkName)
        ? { id: frameworkName, frameworkName }
        : null
    );
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('keeps each a separate copy and fails the sync', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'Foo',
        copies: [
          { packageName: 'pkg-a', moduleRoot: roots.a },
          { packageName: 'pkg-b', moduleRoot: roots.b },
        ],
      },
    ]);
  });
});

// Whether a copy can be built must not hide the other copy: the duplicate fails
// the sync before any copy is linked.
describe('a duplicate pod name whose first copy cannot be built', () => {
  captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-unbuildable-first-copy-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = { a: path.join(tmp, 'expo-a'), b: path.join(tmp, 'expo-b') };
    const a = mixedModule(roots.a, 'ExpoX');
    const b = pureSwiftModule(roots.b, 'ExpoX', spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-a', [['ExpoX', a]]], ['expo-b', [['ExpoX', b]]]])
    );
    providerWrittenTo(path.join(tmp, 'out'));
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync naming both copies', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: 'expo-a', moduleRoot: roots.a },
          { packageName: 'expo-b', moduleRoot: roots.b },
        ],
      },
    ]);
  });
});

describe('a pod whose first listing package has no artifact for it', () => {
  captureConsole();
  let result;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-second-artifact-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const shared = pureSwiftModule(path.join(tmp, 'shared'), 'ExpoX', spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-a', [['ExpoX', shared]]], ['expo-b', [['ExpoX', shared]]]])
    );
    precompiledFrom('expo-b', 'ExpoX');
    providerWrittenTo(path.join(tmp, 'out'));
    result = runPlugin(tmp);
  });

  afterAll(restoreModuleMocks);

  it('precompiles it from the next package that has one', () => {
    expect(result.flavoredFrameworks).toContainEqual({ id: 'ExpoX', frameworkName: 'ExpoX' });
  });
});

describe('a duplicate pod name the prebuilt-metadata document places at the first package', () => {
  captureConsole();
  let roots;
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-documented-duplicate-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    roots = { a: path.join(tmp, 'expo-a'), b: path.join(tmp, 'expo-b') };
    const a = pureSwiftModule(roots.a, 'ExpoX', spec());
    fs.writeFileSync(path.join(a, 'ExpoAExtra.podspec'), spec());
    const b = pureSwiftModule(roots.b, 'ExpoX', spec());
    fs.writeFileSync(path.join(b, 'ExpoBExtra.podspec'), spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-a',
          [
            ['ExpoX', a],
            ['ExpoAExtra', a],
          ],
        ],
        [
          'expo-b',
          [
            ['ExpoX', b],
            ['ExpoBExtra', b],
          ],
        ],
      ])
    );
    prebuiltMetadata.mockReturnValue({ ExpoX: metadataEntry(roots.a, 'ExpoX') });
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it("fails the sync, naming each package's own root", () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: 'expo-a', moduleRoot: roots.a },
          { packageName: 'expo-b', moduleRoot: roots.b },
        ],
      },
    ]);
  });
});

describe('a pure-Swift package listing a pod another package precompiled', () => {
  captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = fs.realpathSync(makeTempDir('expo-spm-foreign-precompiled-'));
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const a = pureSwiftModule(path.join(tmp, 'expo-a'), 'ExpoX', spec());
    const b = pureSwiftModule(path.join(tmp, 'expo-b'), 'ExpoBOwn', spec());
    fs.writeFileSync(path.join(b, 'ExpoX.podspec'), spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ['expo-a', [['ExpoX', a]]],
        [
          'expo-b',
          [
            ['ExpoBOwn', b],
            ['ExpoX', b],
          ],
        ],
      ])
    );
    precompiledFrom('expo-a', 'ExpoX');
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('reports the duplicate pod name, not a partially precompiled module', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          expect.objectContaining({ packageName: 'expo-a' }),
          expect.objectContaining({ packageName: 'expo-b' }),
        ],
      }),
    ]);
  });
});

// A refusal belongs to the module root the refused module was read from, so every
// uncovered pod at that root carries it — whichever package listed the pod.
describe('two packages resolving to one module root', () => {
  captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-shared-root-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const shared = pureSwiftModule(path.join(tmp, 'shared'), 'ExpoSharedA', spec());
    fs.writeFileSync(path.join(shared, 'ExpoSharedB.podspec'), spec());
    fs.writeFileSync(path.join(shared, 'ExpoSharedC.podspec'), spec("  s.frameworks = 'Photos'"));

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-shared-ab',
          [
            ['ExpoSharedA', shared],
            ['ExpoSharedB', shared],
          ],
        ],
        ['expo-shared-c', [['ExpoSharedC', shared]]],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('refuses every uncovered pod at that root for the linkage one module declares', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported.map(({ podName, reason }) => [podName, reason])).toEqual([
      ['ExpoSharedB', 'needs-manifest-for-linkage'],
      ['ExpoSharedC', 'needs-manifest-for-linkage'],
    ]);
  });
});

/**
 * Runs the plugin over `expo-empty`, a module with a podspec at its root and no Apple
 * source directory. Returns the error it fails with and the module root.
 */
function runWithoutSources(prefix, podspec) {
  const tmp = makeTempDir(prefix);
  const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
  const root = path.join(tmp, 'expo-empty');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"expo-empty"}');
  fs.writeFileSync(path.join(root, 'ExpoEmpty.podspec'), podspec);
  resolveExpoModules.mockReturnValue(
    modulesOf([coreAt(core), ['expo-empty', [['ExpoEmpty', root]]]])
  );
  prebuiltMetadata.mockReturnValue({
    ExpoEmpty: metadataEntry(root, 'ExpoEmptyProduct', { sourceOnly: true }),
  });
  return { thrown: thrownBy(() => runPlugin(tmp)), root };
}

describe('a module with no Apple source directory', () => {
  captureConsole();
  let thrown;
  let root;

  beforeAll(() => {
    ({ thrown, root } = runWithoutSources('expo-spm-no-sources-', spec()));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync with the facts its identity gives', () => {
    expect(thrown.unsupported).toEqual([
      {
        reason: 'no-apple-sources',
        podName: 'ExpoEmpty',
        packageName: 'expo-empty',
        moduleRoot: root,
        productName: 'ExpoEmptyProduct',
      },
    ]);
  });
});

describe('a module with no Apple source directory whose podspec declares linkage', () => {
  captureConsole();
  let thrown;
  let root;

  beforeAll(() => {
    ({ thrown, root } = runWithoutSources(
      'expo-spm-no-sources-linkage-',
      spec("  s.frameworks = 'Photos'")
    ));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync on the linkage, which is the more specific fault', () => {
    expect(thrown.unsupported).toEqual([
      {
        reason: 'needs-manifest-for-linkage',
        podName: 'ExpoEmpty',
        packageName: 'expo-empty',
        moduleRoot: root,
        file: path.join(root, 'ExpoEmpty.podspec'),
        line: 2,
        snippet: "s.frameworks = 'Photos'",
      },
    ]);
  });
});

describe('a pure-Swift emission that is refused', () => {
  const logs = captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-pure-swift-refusal-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const refused = pureSwiftModule(path.join(tmp, 'expo-refused'), 'ExpoRefused', spec());

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-refused', [['ExpoRefused', refused]]]])
    );
    emitPureSwiftSourcePackage.mockImplementationOnce(() => ({
      refusal: { reason: 'unresolvable-target-path', targetNames: ['ExpoRefused'] },
    }));
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('fails the sync with the diagnostic registered for the refusal', () => {
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported).toEqual([
      expect.objectContaining({
        reason: 'unresolvable-target-path',
        podName: 'ExpoRefused',
        targetNames: ['ExpoRefused'],
      }),
    ]);
    expect(printed(logs.error)).toContain('"ExpoRefused" declare no `path:`');
  });
});

describe('a Swift macro plugin that does not resolve', () => {
  // pnpm's jest launcher sets a NODE_PATH that finds the plugin whatever `paths`
  // says, so the resolution runs in a Node process without it, from a root with no
  // node_modules above it.
  it('fails with the resolution error as its cause', () => {
    const coreRoot = makeTempDir('expo-spm-no-macros-');
    const script = `
      const { macroPluginFlags } = require(${JSON.stringify(require.resolve('../plugin'))});
      try {
        macroPluginFlags(${JSON.stringify(coreRoot)});
      } catch (error) {
        process.stdout.write(JSON.stringify({ message: error.message, cause: error.cause?.code }));
      }`;
    const { NODE_PATH: _nodePath, ...env } = process.env;
    const { message, cause } = JSON.parse(
      require('child_process').execFileSync(process.execPath, ['-e', script], {
        encoding: 'utf8',
        env,
      })
    );
    expect(message).toContain('Could not resolve "expo-modules-macros"');
    expect(cause).toBe('MODULE_NOT_FOUND');
  });
});

describe('a metadata entry the plugin cannot read', () => {
  captureConsole();

  afterAll(restoreModuleMocks);

  it('fails the sync naming the pod and the field, before emitting anything', () => {
    const tmp = makeTempDir('expo-spm-malformed-metadata-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const imageRoot = path.join(tmp, 'expo-image');
    const image = pureSwiftModule(imageRoot, 'ExpoImage', spec());
    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-image', [['ExpoImage', image]]]])
    );
    prebuiltMetadata.mockReturnValue({
      ExpoImage: metadataEntry(imageRoot, 'ExpoImage', {
        spmPackages: [{ productName: 'SDWebImage', version: { exact: '5.21.6' } }],
      }),
    });
    providerWrittenTo(path.join(tmp, 'out'));

    const error = thrownBy(() => runPlugin(tmp));

    expect(error).not.toBeInstanceOf(TypeError);
    expect(error?.message).toMatch(/^\[expo-spm-plugin\] /);
    expect(error?.message).toContain('ExpoImage');
    expect(error?.message).toContain('spmPackages[0].url');
    expect(fs.existsSync(path.join(tmp, 'out', 'expo', 'expo-source'))).toBe(false);
  });
});

// A module that ships a checked-in Package.swift declares its SwiftPM packages there
// rather than in an spm.config.json, and those cover the pods its podspec names just
// as the pure-Swift branch's do.
describe('the SwiftPM packages a checked-in manifest declares', () => {
  const logs = captureConsole();
  let manifest;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-manifest-deps-plugin-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const imageRoot = path.join(tmp, 'expo-image');
    const image = pureSwiftModule(
      imageRoot,
      'ExpoImage',
      spec(
        "  s.dependency 'ExpoModulesCore'",
        "  s.dependency 'SDWebImage'",
        "  s.dependency 'libavif/libdav1d'",
        "  s.dependency 'SomeUnmappedPod'"
      )
    );
    fs.writeFileSync(
      path.join(imageRoot, 'Package.swift'),
      '// swift-tools-version: 6.0\n// checked in by the module\n'
    );
    const remote = (identity, url, version) => ({
      sourceControl: [
        {
          identity,
          location: { remote: [{ urlString: url }] },
          productFilter: null,
          requirement: { exact: [version] },
        },
      ],
    });
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'ExpoImage',
        dependencies: [
          remote('sdwebimage', 'https://github.com/SDWebImage/SDWebImage.git', '5.21.6'),
          remote('libavif-xcode', 'https://github.com/SDWebImage/libavif-Xcode.git', '1.0.0'),
        ],
        products: [{ name: 'ExpoImage', type: { library: ['automatic'] }, targets: ['ExpoImage'] }],
        targets: [
          {
            name: 'ExpoImage',
            type: 'regular',
            path: 'ios',
            dependencies: [
              { product: ['SDWebImage', 'SDWebImage', null, null] },
              { product: ['libavif', 'libavif-Xcode', null, null] },
            ],
          },
        ],
      })
    );

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-image', [['ExpoImage', image]]]])
    );
    providerWrittenTo(outDir);
    runPlugin(tmp);
    manifest = fs.readFileSync(
      path.join(outDir, 'expo', 'expo-source', 'ExpoImage', 'Package.swift'),
      'utf8'
    );
  });

  afterAll(restoreModuleMocks);

  it('mirrors them into the generated manifest', () => {
    expect(manifest).toContain(
      '.package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),'
    );
    expect(manifest).toContain('.product(name: "libavif", package: "libavif-Xcode"),');
  });

  it('counts them as counterparts of the pods its podspec depends on', () => {
    const report = printed(logs.warn);
    expect(report).toContain('warning: Expo module "expo-image" (pod ExpoImage)');
    expect(report).toContain('SomeUnmappedPod');
    expect(report).not.toContain('SDWebImage');
    // The podspec asks for `libavif/libdav1d` and the check matches on the root name,
    // as CocoaPods does — the mirrored product is `libavif`, whatever its package is
    // called.
    expect(report).not.toContain('libavif');
  });
});

describe('a pure-Swift package shipping a companion pod', () => {
  const logs = captureConsole();
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-companion-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const camera = pureSwiftModule(
      path.join(tmp, 'expo-camera'),
      'ExpoCamera',
      spec("  s.platforms = { :ios => '16.4' }")
    );

    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        [
          'expo-camera',
          [
            ['ExpoCamera', camera],
            ['ExpoCameraBarcodeScanning', camera],
          ],
        ],
      ])
    );
    thrown = thrownBy(() => runPlugin(tmp));
  });

  afterAll(restoreModuleMocks);

  it('emits the single target the pure-Swift branch builds', () => {
    const report = printed(logs.log);
    expect(report).toContain('source pure-Swift (1): ExpoCamera\n');
  });

  // The branch emits one target, for the first pod. Marking the rest of the package
  // emitted too would drop the companion out of the install with no diagnostic at
  // all — it fails at runtime with "Cannot find native module" instead.
  it('reports the companion pod it does not build', () => {
    const report = printed(logs.error);
    expect(report).toContain('ExpoCameraBarcodeScanning');
    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported.map((u) => u.podName)).toEqual(['ExpoCameraBarcodeScanning']);
  });
});

// expo-camera is the shape: one checked-in manifest, two products, one pod. The
// barcode scanner is a companion product autolinking never resolves as a pod, so
// only the manifest links it.
describe('a checked-in manifest declaring a companion product', () => {
  const logs = captureConsole();
  let manifest;
  let thrown;

  beforeAll(() => {
    const tmp = makeTempDir('expo-spm-manifest-multipod-');
    const outDir = path.join(tmp, 'out');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const cameraRoot = path.join(tmp, 'expo-camera');
    const camera = pureSwiftModule(cameraRoot, 'ExpoCamera', spec());
    fs.mkdirSync(path.join(camera, 'barcode-scanning'), { recursive: true });
    fs.writeFileSync(path.join(camera, 'barcode-scanning', 'Scanner.swift'), '// swift\n');
    fs.writeFileSync(
      path.join(cameraRoot, 'Package.swift'),
      '// swift-tools-version: 6.0\n// checked in by the module\n'
    );
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'ExpoCamera',
        dependencies: [],
        products: [
          { name: 'ExpoCamera', type: { library: ['automatic'] }, targets: ['ExpoCamera'] },
          {
            name: 'ExpoCameraBarcodeScanning',
            type: { library: ['automatic'] },
            targets: ['ExpoCameraBarcodeScanning'],
          },
        ],
        targets: [
          { name: 'ExpoCamera', type: 'regular', path: 'ios', dependencies: [] },
          {
            name: 'ExpoCameraBarcodeScanning',
            type: 'regular',
            path: 'ios/barcode-scanning',
            dependencies: [{ byName: ['ExpoCamera', null] }],
          },
        ],
      })
    );

    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-camera', [['ExpoCamera', camera]]]])
    );
    providerWrittenTo(outDir);
    thrown = thrownBy(() => runPlugin(tmp));
    manifest = fs.readFileSync(
      path.join(outDir, 'expo', 'expo-source', 'ExpoCamera', 'Package.swift'),
      'utf8'
    );
  });

  afterAll(restoreModuleMocks);

  it("mirrors a target for each of the manifest's products", () => {
    expect(manifest).toContain('name: "ExpoCamera"');
    expect(manifest).toContain('name: "ExpoCameraBarcodeScanning"');
  });

  it('covers every pod of the package, so none is reported uncovered', () => {
    const report = printed(logs.log);
    expect(report).toContain('not supported (0): —');
    expect(logs.error).not.toHaveBeenCalled();
    expect(thrown).toBeNull();
  });
});

// The gate a companion product declares in its spm.config.json. expo-camera's
// barcode scanner is the one that ships: a second product of the same package,
// linked only when the app's Podfile properties do not disable it.
describe('a product gated by an autolinkWhen condition', () => {
  const logs = captureConsole({ each: true });
  let tmp;
  let cameraRoot;

  beforeEach(() => {
    tmp = makeTempDir('expo-spm-gated-');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    cameraRoot = path.join(tmp, 'expo-camera');
    const camera = pureSwiftModule(cameraRoot, 'ExpoCamera', spec());
    fs.mkdirSync(path.join(camera, 'barcode-scanning'), { recursive: true });
    fs.writeFileSync(path.join(camera, 'barcode-scanning', 'Scanner.swift'), '// swift\n');
    fs.writeFileSync(
      path.join(cameraRoot, 'Package.swift'),
      '// swift-tools-version: 6.0\n// checked in by the module\n'
    );
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'ExpoCamera',
        dependencies: [],
        products: [
          { name: 'ExpoCamera', type: { library: ['automatic'] }, targets: ['ExpoCamera'] },
          {
            name: 'ExpoCameraBarcodeScanning',
            type: { library: ['automatic'] },
            targets: ['ExpoCameraBarcodeScanning'],
          },
        ],
        targets: [
          { name: 'ExpoCamera', type: 'regular', path: 'ios', dependencies: [] },
          {
            name: 'ExpoCameraBarcodeScanning',
            type: 'regular',
            path: 'ios/barcode-scanning',
            dependencies: [{ byName: ['ExpoCamera', null] }],
          },
        ],
      })
    );
    resolveExpoModules.mockReturnValue(
      modulesOf([coreAt(core), ['expo-camera', [['ExpoCamera', camera]]]])
    );
  });

  afterEach(() => {
    runDumpPackage.mockReset();
    restoreModuleMocks();
  });

  /** The properties are read off a real file, through the real reader. */
  const run = ({ metadata, properties = null, autolinking }) => {
    withPodfileProperties(tmp, properties);
    prebuiltMetadata.mockReturnValue(metadata);
    providerWrittenTo(path.join(tmp, 'out'));
    const result = runPlugin(tmp, autolinking ? { autolinking } : {});
    return { result, report: printed(logs.log) };
  };

  const cameraMetadata = (gate) => ({
    ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
    ExpoCameraBarcodeScanning: metadataEntry(cameraRoot, 'ExpoCameraBarcodeScanning', {
      autolinkWhen: gate,
    }),
  });
  const enabled = { 'expo.camera.barcode-scanner-enabled': 'true' };
  const disabled = { 'expo.camera.barcode-scanner-enabled': 'false' };
  const cameraProduct = { name: 'ExpoCamera', package: 'ExpoCamera' };
  const scannerProduct = { name: 'ExpoCameraBarcodeScanning', package: 'ExpoCamera' };
  const gatedOff = (label) => `gated off (1): ExpoCameraBarcodeScanning (${label})`;

  it.each([
    {
      title: 'wires the gated product when the condition is met',
      metadata: () => cameraMetadata(barcodeGate),
      properties: enabled,
      withheldBy: null,
    },
    {
      title: 'withholds the gated product, and reports it, when the condition is not met',
      metadata: () => cameraMetadata(barcodeGate),
      properties: disabled,
      withheldBy: 'expo.camera.barcode-scanner-enabled',
    },
    {
      title: 'fails open: wires a product no metadata entry names',
      metadata: () => ({ ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera') }),
      properties: disabled,
      withheldBy: null,
    },
    {
      title: "ignores a same-named product's gate in another package",
      metadata: () => ({
        ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
        OtherBarcodeScanning: metadataEntry(
          path.join(tmp, 'other-camera'),
          'ExpoCameraBarcodeScanning',
          { autolinkWhen: barcodeGate }
        ),
      }),
      properties: disabled,
      withheldBy: null,
    },
    {
      title: 'wires a product gated on a pod the document declares, though no module lists it',
      metadata: () => ({
        ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
        ExpoCameraBarcodeScanning: metadataEntry(cameraRoot, 'ExpoCameraBarcodeScanning', {
          autolinkWhen: { podName: 'RNWorklets' },
        }),
        RNWorklets: metadataEntry(path.join(tmp, 'react-native-worklets'), 'RNWorklets'),
      }),
      properties: null,
      withheldBy: null,
    },
    {
      title: 'withholds a product gated on a pod the document does not declare',
      metadata: () => cameraMetadata({ podName: 'RNWorklets' }),
      properties: null,
      withheldBy: 'RNWorklets',
    },
    {
      title: 'wires a product gated on an npm package the app autolinks',
      metadata: () => cameraMetadata({ npmPackage: 'expo-modules-core' }),
      properties: null,
      withheldBy: null,
    },
    {
      title: 'withholds a product gated on an npm package the app does not autolink',
      metadata: () => cameraMetadata({ npmPackage: 'react-native-worklets' }),
      properties: null,
      withheldBy: 'react-native-worklets',
    },
    {
      // As CocoaPods, which reads the React Native config: the key alone counts,
      // whether or not its root is on disk.
      title: 'wires a product gated on an npm package React Native autolinks',
      metadata: () => cameraMetadata({ npmPackage: 'react-native-worklets' }),
      properties: null,
      autolinking: {
        dependencies: { 'react-native-worklets': { root: '/nonexistent/react-native-worklets' } },
      },
      withheldBy: null,
    },
    {
      title: 'matches the entry by its product name, not by its pod key',
      metadata: () => ({
        ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
        ExpoCameraBarcodeScanner: metadataEntry(cameraRoot, 'ExpoCameraBarcodeScanning', {
          autolinkWhen: barcodeGate,
        }),
      }),
      properties: disabled,
      withheldBy: 'expo.camera.barcode-scanner-enabled',
    },
    {
      title: 'matches an entry naming no product by its pod key',
      metadata: () => ({
        ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
        ExpoCameraBarcodeScanning: { packageRoot: cameraRoot, autolinkWhen: barcodeGate },
      }),
      properties: disabled,
      withheldBy: 'expo.camera.barcode-scanner-enabled',
    },
    {
      title: 'withholds, as CocoaPods does, a product whose condition names no recognized key',
      metadata: () => cameraMetadata({}),
      properties: null,
      withheldBy: 'unrecognized condition',
    },
  ])('$title', ({ metadata, properties, autolinking, withheldBy }) => {
    const { result, report } = run({ metadata: metadata(), properties, autolinking });

    if (withheldBy == null) {
      expect(result.productDependencies).toEqual([cameraProduct, scannerProduct]);
      expect(report).toContain('gated off (0): —');
    } else {
      expect(result.productDependencies).toEqual([cameraProduct]);
      expect(report).toContain(gatedOff(withheldBy));
    }
  });

  it('withholds a gated companion pod that only the document declares', () => {
    const [core, camera] = resolveExpoModules().modules;
    resolveExpoModules.mockReturnValue({
      modules: [core, { ...camera, pods: [camera.pods[0]] }],
      extraDependencies: [],
    });
    const { result, report } = run({ metadata: cameraMetadata(barcodeGate), properties: disabled });

    expect(result.productDependencies).toEqual([cameraProduct]);
    expect(report).toContain(gatedOff('expo.camera.barcode-scanner-enabled'));
  });

  // A withheld product is a deliberate exclusion, not a module SwiftPM cannot
  // build: its pod stays emitted, so the sync does not fail it as unsupported.
  it('does not report the withheld product as unsupported', () => {
    const { report } = run({ metadata: cameraMetadata(barcodeGate), properties: disabled });

    expect(report).toContain('not supported (0): —');
    expect(logs.error).not.toHaveBeenCalled();
  });

  // The manifest path evaluates the condition itself, so the refusal of a companion
  // its module links some other way does not apply here.
  it.each([
    { condition: 'met', properties: enabled },
    { condition: 'not met', properties: disabled },
  ])(
    'does not refuse a gated companion the manifest links when the condition is $condition',
    ({ properties }) => {
      expect(thrownBy(() => run({ metadata: cameraMetadata(barcodeGate), properties }))).toBeNull();
      expect(logs.error).not.toHaveBeenCalled();
    }
  );

  describe('when the manifest does not export the gated companion', () => {
    beforeEach(() => {
      const dumped = JSON.parse(runDumpPackage());
      const isCamera = ({ name }) => name === 'ExpoCamera';
      runDumpPackage.mockReturnValue(
        JSON.stringify({
          ...dumped,
          products: dumped.products.filter(isCamera),
          targets: dumped.targets.filter(isCamera),
        })
      );
    });

    const refusedCompanion = expect.objectContaining({
      reason: 'companion-not-exported-by-manifest',
      podName: 'ExpoCameraBarcodeScanning',
      productName: 'ExpoCameraBarcodeScanning',
      packageName: 'expo-camera',
    });

    // CocoaPods would link the companion here, so building without it would drop a
    // feature the app has under CocoaPods.
    it.each([
      { gate: 'a Podfile property', autolinkWhen: barcodeGate, properties: enabled },
      { gate: 'an npm package', autolinkWhen: { npmPackage: 'expo-modules-core' } },
      { gate: 'a pod', autolinkWhen: { podName: 'ExpoCamera' } },
    ])('fails the sync when its condition on $gate is met', ({ autolinkWhen, properties }) => {
      const thrown = thrownBy(() => run({ metadata: cameraMetadata(autolinkWhen), properties }));

      expect(thrown).toBeInstanceOf(UnsupportedModulesError);
      expect(thrown.unsupported).toEqual([refusedCompanion]);
      expect(printed(logs.error)).toContain('"ExpoCameraBarcodeScanning"');
      expect(printed(logs.error)).toContain('"expo-camera"');
    });

    it.each([
      { gate: 'a Podfile property', autolinkWhen: barcodeGate, properties: disabled },
      { gate: 'an npm package', autolinkWhen: { npmPackage: 'react-native-worklets' } },
      { gate: 'a pod', autolinkWhen: { podName: 'RNWorklets' } },
    ])(
      'links the rest of the manifest when its condition on $gate is not met',
      ({ autolinkWhen, properties }) => {
        const { result } = run({ metadata: cameraMetadata(autolinkWhen), properties });

        expect(result.productDependencies).toEqual([cameraProduct]);
        expect(logs.error).not.toHaveBeenCalled();
      }
    );

    it('fails the sync when the companion documents its package through a symlink', () => {
      const alias = path.join(tmp, 'expo-camera-alias');
      fs.symlinkSync(cameraRoot, alias, 'dir');
      const metadata = {
        ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
        ExpoCameraBarcodeScanning: metadataEntry(alias, 'ExpoCameraBarcodeScanning', {
          autolinkWhen: barcodeGate,
        }),
      };

      const thrown = thrownBy(() => run({ metadata, properties: enabled }));

      expect(thrown).toBeInstanceOf(UnsupportedModulesError);
      expect(thrown.unsupported).toEqual([refusedCompanion]);
    });
  });

  // A properties file nobody can read leaves every gate unset, and an unset gate
  // links the product. Guessing it open would link what this app may exclude.
  it('fails instead of linking the gated product when the properties file is unusable', () => {
    expect(() =>
      run({ metadata: cameraMetadata(barcodeGate), properties: '{ "expo.camera' })
    ).toThrow(/Podfile\.properties\.json could not be read as Podfile properties/);
  });

  // Pins a path the real document cannot reach: `prebuiltMetadata` writes
  // `packageRoot` only from a resolved package path. Read past, the gate would
  // never line up with the module and the product would link ungated.
  it('fails the sync on an entry that documents an unusable package root', () => {
    const error = thrownBy(() =>
      run({
        metadata: {
          ExpoCamera: metadataEntry(cameraRoot, 'ExpoCamera'),
          ExpoCameraBarcodeScanning: { packageRoot: 17, autolinkWhen: barcodeGate },
        },
        properties: { 'expo.camera.barcode-scanner-enabled': 'false' },
      })
    );

    expect(error?.message).toContain(
      'entry for pod ExpoCameraBarcodeScanning has an unusable packageRoot'
    );
  });

  // The app target is a pure function of the app root, and generating the
  // registry against a second reading of it would let the two disagree.
  it('resolves the app target once', () => {
    run({ metadata: cameraMetadata(barcodeGate) });

    expect(resolveAppTarget).toHaveBeenCalledTimes(1);
  });
});

// The condition is checked only where a module ships a checked-in Package.swift.
// A gated pod reaching the plugin any other way would be linked with its
// condition ignored, so the sync refuses it whichever way the condition falls.
describe('a gated pod linked where its autolinkWhen condition is not checked', () => {
  const logs = captureConsole({ each: true });
  let tmp;
  let modules;

  beforeEach(() => {
    tmp = makeTempDir('expo-spm-unchecked-gate-');
    const podspecDirs = {
      ExpoModulesCore: pureSwiftModule(
        path.join(tmp, 'expo-modules-core'),
        'ExpoModulesCore',
        spec()
      ),
      ExpoCamera: pureSwiftModule(path.join(tmp, 'expo-camera'), 'ExpoCamera', spec()),
      ExpoScanner: pureSwiftModule(path.join(tmp, 'expo-scanner'), 'ExpoScanner', spec()),
      ExpoImage: pureSwiftModule(path.join(tmp, 'expo-image'), 'ExpoImage', spec()),
    };
    modules = Object.fromEntries(
      [
        ['expo-modules-core', 'ExpoModulesCore'],
        ['expo-camera', 'ExpoCamera'],
        ['expo-scanner', 'ExpoScanner'],
        ['expo-image', 'ExpoImage'],
      ].map(([packageName, podName]) => [
        packageName,
        { packageName, pods: [{ podName, podspecDir: podspecDirs[podName] }] },
      ])
    );
  });

  afterAll(() => {
    restoreModuleMocks();
  });

  const documented = (packageName, productName, autolinkWhen = null) =>
    metadataEntry(path.join(tmp, packageName), productName, autolinkWhen && { autolinkWhen });

  const run = ({ packages, metadata, precompiled = [], properties = null }) => {
    withPodfileProperties(tmp, properties);
    resolveExpoModules.mockReturnValue({
      modules: ['expo-modules-core', ...packages].map((name) => modules[name]),
      extraDependencies: [],
    });
    prebuiltMetadata.mockReturnValue(metadata);
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      frameworkName === 'ExpoModulesCore' || precompiled.includes(frameworkName)
        ? { id: frameworkName.toLowerCase(), frameworkName }
        : null
    );
    providerWrittenTo(path.join(tmp, 'out'));
    let result = null;
    const thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
    return { result, thrown, report: printed(logs.error) };
  };

  // expo-camera's real shape: `apple.podspecPath` lists ExpoCamera alone, and only the
  // document knows the barcode scanner.
  const cameraCompanion = ({ precompiled = [], autolinkWhen = barcodeGate } = {}) => ({
    packages: ['expo-camera'],
    metadata: {
      ExpoCamera: documented('expo-camera', 'ExpoCamera'),
      ExpoCameraBarcodeScanning: documented(
        'expo-camera',
        'ExpoCameraBarcodeScanning',
        autolinkWhen
      ),
    },
    precompiled,
  });
  const precompiledCompanion = () => cameraCompanion({ precompiled: ['ExpoCamera'] });

  const sourceGated = (autolinkWhen = barcodeGate) => ({
    packages: ['expo-scanner'],
    metadata: { ExpoScanner: documented('expo-scanner', 'ExpoScanner', autolinkWhen) },
  });

  const refusedPods = [
    {
      linked: 'resolved as a precompiled framework',
      gated: (autolinkWhen) => ({ ...sourceGated(autolinkWhen), precompiled: ['ExpoScanner'] }),
      podName: 'ExpoScanner',
      packageName: 'expo-scanner',
      precompiled: true,
      reported: 'precompiled',
    },
    {
      linked: 'built from source without a checked-in Package.swift',
      gated: sourceGated,
      podName: 'ExpoScanner',
      packageName: 'expo-scanner',
      precompiled: false,
      reported: 'without a checked-in Package.swift',
    },
  ];
  // Unlike a companion's, the pod's own condition is refused whatever key decides it.
  it.each(
    refusedPods.flatMap((pod) => [
      { ...pod, condition: 'met', properties: { 'expo.camera.barcode-scanner-enabled': 'true' } },
      {
        ...pod,
        condition: 'not met',
        properties: { 'expo.camera.barcode-scanner-enabled': 'false' },
      },
      { ...pod, condition: 'on a pod and not met', autolinkWhen: { podName: 'RNWorklets' } },
      {
        ...pod,
        condition: 'on an npm package and not met',
        autolinkWhen: { npmPackage: 'react-native-worklets' },
      },
    ])
  )(
    'refuses a gated pod $linked when the condition is $condition',
    ({ gated, autolinkWhen, podName, packageName, precompiled, reported, properties }) => {
      const { result, thrown, report } = run({ ...gated(autolinkWhen), properties });

      expect(result).toBeNull();
      expect(thrown).toBeInstanceOf(UnsupportedModulesError);
      expect(thrown.unsupported).toEqual([
        expect.objectContaining({
          reason: 'unchecked-autolink-condition',
          podName,
          packageName,
          productName: podName,
          precompiled,
        }),
      ]);
      expect(report).toContain(`"${podName}"`);
      expect(report).toContain(`"${packageName}"`);
      expect(report).toContain(reported);
    }
  );

  it('links an ungated precompiled pod', () => {
    const { result, thrown } = run({
      packages: ['expo-image'],
      metadata: { ExpoImage: documented('expo-image', 'ExpoImage') },
      precompiled: ['ExpoImage'],
    });

    expect(thrown).toBeNull();
    expect(result.flavoredFrameworks.map((f) => f.frameworkName)).toContain('ExpoImage');
  });

  // Autolinking never resolves a companion as a pod, so only a checked-in manifest
  // links it. Its module linked any other way leaves it out, which is right only
  // where CocoaPods leaves it out too: where its condition is not met.
  const companionPaths = [
    {
      linked: 'resolved as a precompiled framework',
      precompiled: ['ExpoCamera'],
      reported: 'its pod ExpoCamera as a precompiled XCFramework',
    },
    {
      linked: 'built from source without a checked-in Package.swift',
      precompiled: [],
      reported: 'its pod ExpoCamera from source without a checked-in Package.swift',
    },
  ];
  const scannerEnabled = { 'expo.camera.barcode-scanner-enabled': 'true' };
  const scannerDisabled = { 'expo.camera.barcode-scanner-enabled': 'false' };

  it.each(companionPaths)(
    'refuses a gated companion of a module $linked when the condition is met',
    ({ precompiled, reported }) => {
      const { result, thrown, report } = run({
        ...cameraCompanion({ precompiled }),
        properties: scannerEnabled,
      });

      expect(result).toBeNull();
      expect(thrown).toBeInstanceOf(UnsupportedModulesError);
      expect(thrown.unsupported).toEqual([
        expect.objectContaining({
          reason: 'unchecked-autolink-condition',
          podName: 'ExpoCameraBarcodeScanning',
          packageName: 'expo-camera',
          productName: 'ExpoCameraBarcodeScanning',
          precompiled: precompiled.length > 0,
        }),
      ]);
      expect(report).toContain(reported);
      expect(report).toContain('"ExpoCameraBarcodeScanning" would be left out of the app');
      expect(report).not.toContain('apple.podspecPath');
    }
  );

  it.each(companionPaths)(
    'omits a gated companion of a module $linked when the condition is not met',
    ({ precompiled }) => {
      const { result, thrown } = run({
        ...cameraCompanion({ precompiled }),
        properties: scannerDisabled,
      });

      expect(thrown).toBeNull();
      expect(JSON.stringify(result)).not.toContain('ExpoCameraBarcodeScanning');
    }
  );

  // The app cannot switch a pod or npm package gate off, so refusing such a companion
  // would block every app that installs what it names.
  it.each(
    companionPaths.flatMap((companionPath) => [
      { ...companionPath, gate: 'an npm package', autolinkWhen: { npmPackage: 'expo-camera' } },
      {
        ...companionPath,
        gate: 'a pod before a Podfile property',
        autolinkWhen: { podName: 'ExpoCamera', ...barcodeGate },
      },
    ])
  )(
    'leaves out a companion gated on $gate of a module $linked with a warning when the condition is met',
    ({ precompiled, autolinkWhen }) => {
      const { result, thrown } = run({
        ...cameraCompanion({ precompiled, autolinkWhen }),
        properties: scannerEnabled,
      });

      expect(thrown).toBeNull();
      expect(JSON.stringify(result)).not.toContain('ExpoCameraBarcodeScanning');
      expect(logs.error).not.toHaveBeenCalled();
      expect(printed(logs.warn)).toContain('"ExpoCameraBarcodeScanning"');
      expect(printed(logs.warn)).toContain('"expo-camera"');
    }
  );

  it.each(
    companionPaths.flatMap((companionPath) => [
      {
        ...companionPath,
        gate: 'an npm package',
        autolinkWhen: { npmPackage: 'react-native-worklets' },
      },
      { ...companionPath, gate: 'a pod', autolinkWhen: { podName: 'RNWorklets' } },
    ])
  )(
    'omits a companion gated on $gate of a module $linked without a warning when the condition is not met',
    ({ precompiled, autolinkWhen }) => {
      const { result, thrown } = run({ ...cameraCompanion({ precompiled, autolinkWhen }) });

      expect(thrown).toBeNull();
      expect(JSON.stringify(result)).not.toContain('ExpoCameraBarcodeScanning');
      expect(printed(logs.warn)).not.toContain('ExpoCameraBarcodeScanning');
    }
  );

  // expo-modules-core ships one too, and every sync precompiles that module. The
  // document declares RNWorklets whenever react-native-worklets is installed.
  describe("expo-modules-core's worklets adapter", () => {
    const adapter = () =>
      metadataEntry(path.join(tmp, 'expo-modules-core'), 'ExpoModulesWorkletsAdapter', {
        sourceOnly: true,
        autolinkWhen: { podName: 'RNWorklets' },
      });

    it('is omitted where the app does not declare RNWorklets', () => {
      const { thrown } = run({
        packages: [],
        metadata: { ExpoModulesWorkletsAdapter: adapter() },
      });

      expect(thrown).toBeNull();
    });

    it('is left out with a warning where the app declares RNWorklets', () => {
      const { result, thrown } = run({
        packages: [],
        metadata: {
          ExpoModulesWorkletsAdapter: adapter(),
          RNWorklets: documented('react-native-worklets', 'RNWorklets'),
        },
      });

      expect(thrown).toBeNull();
      expect(result.productDependencies.map((dep) => dep.name)).not.toContain(
        'ExpoModulesWorkletsAdapter'
      );
      expect(printed(logs.warn)).toContain('"ExpoModulesWorkletsAdapter"');
      expect(printed(logs.warn)).toContain('"expo-modules-core"');
    });

    it('is named in the same warning as every other companion left out', () => {
      const camera = cameraCompanion({ autolinkWhen: { npmPackage: 'expo-camera' } });
      const { thrown } = run({
        ...camera,
        metadata: {
          ...camera.metadata,
          ExpoModulesWorkletsAdapter: adapter(),
          RNWorklets: documented('react-native-worklets', 'RNWorklets'),
        },
      });

      expect(thrown).toBeNull();
      const companionWarnings = logs.warn.mock.calls
        .map(([text]) => text)
        .filter(
          (text) =>
            text.includes('ExpoModulesWorkletsAdapter') ||
            text.includes('ExpoCameraBarcodeScanning')
        );
      expect(companionWarnings).toHaveLength(1);
      expect(companionWarnings[0]).toContain('"ExpoModulesWorkletsAdapter"');
      expect(companionWarnings[0]).toContain('"ExpoCameraBarcodeScanning"');
    });

    it('is still named when a companion gated on a Podfile property fails the sync', () => {
      const camera = cameraCompanion();
      const { thrown } = run({
        ...camera,
        metadata: {
          ...camera.metadata,
          ExpoModulesWorkletsAdapter: adapter(),
          RNWorklets: documented('react-native-worklets', 'RNWorklets'),
        },
        properties: scannerEnabled,
      });

      expect(thrown).toBeInstanceOf(UnsupportedModulesError);
      expect(thrown.unsupported).toEqual([
        expect.objectContaining({
          reason: 'unchecked-autolink-condition',
          podName: 'ExpoCameraBarcodeScanning',
        }),
      ]);
      expect(printed(logs.warn)).toContain('"ExpoModulesWorkletsAdapter"');
      expect(printed(logs.warn)).not.toContain('ExpoCameraBarcodeScanning');
    });
  });

  // Pass 2 re-emits a package's first pod when a sibling is not precompiled.
  it('reports a precompiled gated pod once when pass 2 reaches its package again', () => {
    const [scanner] = modules['expo-scanner'].pods;
    modules['expo-scanner'].pods.push({
      podName: 'ExpoScannerExtra',
      podspecDir: scanner.podspecDir,
    });

    const { thrown } = run({ ...sourceGated(), precompiled: ['ExpoScanner'] });

    expect(
      thrown.unsupported.filter((entry) => entry.reason === 'unchecked-autolink-condition')
    ).toEqual([expect.objectContaining({ podName: 'ExpoScanner', precompiled: true })]);
  });

  it('reports a gated companion of a precompiled pod once when pass 2 reaches its package again', () => {
    const [camera] = modules['expo-camera'].pods;
    modules['expo-camera'].pods.push({
      podName: 'ExpoCameraExtra',
      podspecDir: camera.podspecDir,
    });

    const { thrown } = run({ ...precompiledCompanion() });

    expect(
      thrown.unsupported.filter((entry) => entry.reason === 'unchecked-autolink-condition')
    ).toEqual([
      expect.objectContaining({ podName: 'ExpoCameraBarcodeScanning', precompiled: true }),
    ]);
  });

  it('names every refused pod in one error', () => {
    const { thrown, report } = run({
      packages: ['expo-camera', 'expo-scanner'],
      metadata: { ...precompiledCompanion().metadata, ...sourceGated().metadata },
      precompiled: ['ExpoCamera'],
    });

    expect(thrown).toBeInstanceOf(UnsupportedModulesError);
    expect(thrown.unsupported.map((entry) => entry.podName)).toEqual([
      'ExpoCameraBarcodeScanning',
      'ExpoScanner',
    ]);
    expect(logs.error).toHaveBeenCalledTimes(1);
    expect(report).toContain('"ExpoCameraBarcodeScanning"');
    expect(report).toContain('"ExpoScanner"');
  });
});

// npm never ships the ExpoModulesJSI binary: it must be compiled against the app's
// React Native. Source packages compile against its headers XCFramework, and an app
// build phase builds, links and embeds the real framework.
describe('ExpoModulesJSI', () => {
  captureConsole();

  /**
   * Writes the expo-modules-jsi `versions`: `headers` into the headers' stamp, `autolinked`
   * into the autolinked package, and `built` into the copy the build phase's launcher reaches
   * through expo and expo-modules-core. Returns that copy's directory.
   */
  function writeJsiVersions(tmp, headersXCFramework, { headers, autolinked, built }) {
    const writePackage = (dir, name, version) => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }));
      return dir;
    };
    fs.writeFileSync(
      path.join(headersXCFramework, 'expo-package.json'),
      JSON.stringify({ name: 'expo-modules-jsi', version: headers })
    );
    writePackage(path.join(tmp, 'expo-modules-jsi'), 'expo-modules-jsi', autolinked);
    const expo = writePackage(path.join(tmp, 'app', 'node_modules', 'expo'), 'expo', '1.0.0');
    const core = writePackage(
      path.join(expo, 'node_modules', 'expo-modules-core'),
      'expo-modules-core',
      '1.0.0'
    );
    return writePackage(
      path.join(core, 'node_modules', 'expo-modules-jsi'),
      'expo-modules-jsi',
      built
    );
  }

  /**
   * Runs the plugin for core, expo-asset and, with `withJsi`, expo-modules-jsi. `versions`
   * stamps the headers and installs versions as `writeJsiVersions` describes.
   */
  function syncApp({ withJsi = true, headers = 'resolved', versions } = {}) {
    const tmp = makeTempDir('expo-spm-jsi-');
    const outDir = path.join(tmp, 'out');
    const headersXCFramework = path.join(tmp, 'npm', 'ExpoModulesJSIHeaders.xcframework');
    fs.mkdirSync(headersXCFramework, { recursive: true });
    fs.writeFileSync(path.join(headersXCFramework, 'Info.plist'), '<plist/>');
    const core = pureSwiftModule(path.join(tmp, 'expo-modules-core'), 'ExpoModulesCore', spec());
    const jsi = pureSwiftModule(path.join(tmp, 'expo-modules-jsi'), 'ExpoModulesJSI', spec());
    const asset = pureSwiftModule(path.join(tmp, 'expo-asset'), 'ExpoAsset', spec());
    const builtJsiRoot =
      versions == null ? null : writeJsiVersions(tmp, headersXCFramework, versions);
    resolveExpoModules.mockReturnValue(
      modulesOf([
        coreAt(core),
        ...(withJsi ? [['expo-modules-jsi', [['ExpoModulesJSI', jsi]]]] : []),
        ['expo-asset', [['ExpoAsset', asset]]],
      ])
    );
    // A Debug/Release JSI pair exists, as in a monorepo prebuild or an older package.
    resolveFlavoredFramework.mockImplementation(({ frameworkName }) =>
      ['ExpoModulesCore', 'ExpoModulesJSI'].includes(frameworkName)
        ? { id: frameworkName, frameworkName }
        : null
    );
    resolveHeadersXCFramework.mockReset();
    resolveHeadersXCFramework.mockReturnValue(headers === 'resolved' ? headersXCFramework : null);
    providerWrittenTo(outDir);
    let result = null;
    const thrown = thrownBy(() => {
      result = runPlugin(tmp);
    });
    const assetManifest = () =>
      fs.readFileSync(
        path.join(outDir, 'expo', 'expo-source', 'ExpoAsset', 'Package.swift'),
        'utf8'
      );
    return { tmp, outDir, headersXCFramework, builtJsiRoot, result, thrown, assetManifest };
  }

  afterAll(restoreModuleMocks);

  describe('when expo-modules-jsi is autolinked', () => {
    let app;

    beforeAll(() => {
      app = syncApp();
    });

    it('never links it as a precompiled framework, even when a Debug/Release pair exists', () => {
      expect(app.thrown).toBeNull();
      expect(app.result.flavoredFrameworks.map((f) => f.frameworkName)).toEqual([
        'ExpoModulesCore',
      ]);
      expect(resolvedFor('expo-modules-jsi')).toBeUndefined();
    });

    it("looks the headers up from the package's own lookup bases, into the plugin cache", () => {
      expect(resolveHeadersXCFramework).toHaveBeenCalledWith({
        packageName: 'expo-modules-jsi',
        moduleRoot: path.join(app.tmp, 'expo-modules-jsi'),
        productName: 'ExpoModulesJSI',
        cacheDir: path.join(app.tmp, 'app', 'ios', 'build', 'expo-xcframeworks'),
      });
    });

    it('emits the headers package over the resolved XCFramework', () => {
      const pkgDir = path.join(app.outDir, 'expo', 'ExpoModulesJSIHeaders');
      expect(fs.readFileSync(path.join(pkgDir, 'Package.swift'), 'utf8')).toContain(
        '.linkedFramework("ExpoModulesJSI")'
      );
      expect(fs.readlinkSync(path.join(pkgDir, 'ExpoModulesJSIHeaders.xcframework'))).toBe(
        app.headersXCFramework
      );
    });

    it('makes every emitted source package depend on the headers package', () => {
      const pkgDir = path.join(app.outDir, 'expo', 'ExpoModulesJSIHeaders');
      expect(app.assetManifest()).toContain(
        `.package(name: "ExpoModulesJSIHeaders", path: "${pkgDir}")`
      );
      expect(app.assetManifest()).toContain(
        '.product(name: "ExpoModulesJSIHeaders", package: "ExpoModulesJSIHeaders")'
      );
    });

    it('adds the build phase', () => {
      expect(app.result.scriptPhases.map((p) => p.id)).toContain('expo-modules-jsi.build');
    });
  });

  describe('when its headers are missing everywhere', () => {
    it('fails the sync, saying what is missing, why it is needed and how to get it', () => {
      const { thrown } = syncApp({ headers: 'missing' });
      expect(thrown).toBeInstanceOf(Error);
      expect(thrown.message).toContain('ExpoModulesJSIHeaders');
      expect(thrown.message).toMatch(/only the headers/);
      expect(thrown.message).toMatch(/reinstall/i);
      expect(thrown.message).toContain(
        'From the Expo repository root, build the headers with `node tools/bin/expotools.js prebuild expo-modules-jsi`'
      );
    });
  });

  // The build phase compiles the framework from the installed sources, so headers of another
  // version leave a source package referencing a symbol the framework lacks.
  describe('when its headers are stamped with a version', () => {
    it('fails the sync when the autolinked expo-modules-jsi is another version', () => {
      const app = syncApp({ versions: { headers: '2.0.0', autolinked: '1.0.0', built: '2.0.0' } });
      expect(app.thrown).toBeInstanceOf(Error);
      for (const part of [app.headersXCFramework, '2.0.0', '1.0.0']) {
        expect(app.thrown.message).toContain(part);
      }
      expect(app.thrown.message).toContain(path.join(app.tmp, 'expo-modules-jsi'));
      expect(app.thrown.message).toMatch(/et prebuild expo-modules-jsi/);
    });

    it('fails the sync when the copy the build phase builds is another version', () => {
      const app = syncApp({ versions: { headers: '1.0.0', autolinked: '1.0.0', built: '1.1.0' } });
      expect(app.thrown).toBeInstanceOf(Error);
      expect(app.thrown.message).toContain(app.builtJsiRoot);
      expect(app.thrown.message).toContain('1.1.0');
    });

    it('syncs when every copy is that version', () => {
      const app = syncApp({ versions: { headers: '1.0.0', autolinked: '1.0.0', built: '1.0.0' } });
      expect(app.thrown).toBeNull();
    });
  });

  describe('when expo-modules-jsi is not autolinked', () => {
    let app;

    beforeAll(() => {
      app = syncApp({ withJsi: false });
    });

    it('adds no headers package, no dependency on one and no build phase', () => {
      expect(app.thrown).toBeNull();
      expect(resolveHeadersXCFramework).not.toHaveBeenCalled();
      expect(fs.existsSync(path.join(app.outDir, 'expo', 'ExpoModulesJSIHeaders'))).toBe(false);
      expect(app.assetManifest()).not.toContain('ExpoModulesJSIHeaders');
      expect(app.result.scriptPhases.map((p) => p.id)).not.toContain('expo-modules-jsi.build');
    });
  });
});
