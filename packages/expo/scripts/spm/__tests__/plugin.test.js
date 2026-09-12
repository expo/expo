'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../cli', () => ({
  resolveExpoModules: jest.fn(),
  generateModulesProvider: jest.fn(() => null),
  runDumpPackage: jest.fn(),
}));
jest.mock('../flavored-frameworks', () => ({
  resolveFlavoredFramework: jest.fn(({ frameworkName }) =>
    frameworkName === 'ExpoModulesCore' ? { id: 'ExpoModulesCore', name: 'ExpoModulesCore' } : null
  ),
  prepareCompileInterfaces: jest.fn(() => '/abs/interfaces'),
}));

const { resolveExpoModules } = require('../cli');
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
