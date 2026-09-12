'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../cli', () => ({
  resolveExpoModules: jest.fn(),
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

const { resolveExpoModules, generateModulesProvider } = require('../cli');
const { resolveAppTarget } = require('../app-target');
const { UnsupportedModulesError } = require('../diagnostics');
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
