'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('child_process', () => ({ execFileSync: jest.fn(() => '') }));

const { execFileSync } = require('child_process');
const { generateModulesProvider, prebuiltMetadata, resolveExpoModules } = require('../cli');

function argvFor(options) {
  execFileSync.mockClear();
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-cli-'));
  generateModulesProvider({
    appRoot: path.join(os.tmpdir(), 'app'),
    outDir,
    moduleNames: ['expo', 'expo-font'],
    ...options,
  });
  return execFileSync.mock.calls[0][1];
}

function valueOf(argv, flag) {
  const index = argv.indexOf(flag);
  return index === -1 ? null : argv[index + 1];
}

describe('generateModulesProvider', () => {
  it('always passes the target, app root and platform', () => {
    const argv = argvFor({});
    expect(argv[1]).toBe('generate-modules-provider');
    expect(valueOf(argv, '--target')).toMatch(/ExpoModulesProvider\.swift$/);
    expect(valueOf(argv, '--app-root')).toBe(path.join(os.tmpdir(), 'app'));
    expect(valueOf(argv, '--platform')).toBe('apple');
  });

  it('passes the app target name, entitlements and Podfile properties when resolved', () => {
    const argv = argvFor({
      targetName: 'minimalswiftpm',
      entitlementPath: '/app/ios/minimalswiftpm/minimalswiftpm.entitlements',
      podfilePropertiesPath: '/app/ios/Podfile.properties.json',
    });
    expect(valueOf(argv, '--target-name')).toBe('minimalswiftpm');
    expect(valueOf(argv, '--entitlement')).toBe(
      '/app/ios/minimalswiftpm/minimalswiftpm.entitlements'
    );
    expect(valueOf(argv, '--podfile-properties-file-path')).toBe(
      '/app/ios/Podfile.properties.json'
    );
  });

  it('omits each flag the app does not provide', () => {
    const argv = argvFor({
      targetName: null,
      entitlementPath: null,
      podfilePropertiesPath: null,
    });
    expect(argv).not.toContain('--target-name');
    expect(argv).not.toContain('--entitlement');
    expect(argv).not.toContain('--podfile-properties-file-path');
  });

  // `--packages` is variadic, so anything after it is swallowed as a package name.
  it('keeps the variadic package list last', () => {
    const argv = argvFor({ targetName: 'minimalswiftpm' });
    expect(argv.slice(-3)).toEqual(['--packages', 'expo', 'expo-font']);
  });

  // Commander rejects a variadic option with no value, so an app that excludes
  // every Expo module would fail the sync rather than generate an empty registry.
  it('does not run the generator when no packages are autolinked', () => {
    execFileSync.mockClear();
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-cli-'));
    const appRoot = path.join(os.tmpdir(), 'app');

    expect(generateModulesProvider({ appRoot, outDir, moduleNames: [] })).toBeNull();
    expect(execFileSync).not.toHaveBeenCalled();
  });
});

describe('prebuiltMetadata', () => {
  const document = {
    ExpoModulesCore: {
      type: 'internal',
      npmPackage: 'expo-modules-core',
      packageRoot: '/app/node_modules/expo-modules-core',
      podspecDir: '/app/node_modules/expo-modules-core/ios',
      productName: 'ExpoModulesCore',
    },
  };

  it('asks the autolinking CLI for the metadata document, from the app root', () => {
    execFileSync.mockClear();
    execFileSync.mockReturnValue(JSON.stringify(document));

    expect(prebuiltMetadata('/app')).toEqual(document);
    const [, argv, options] = execFileSync.mock.calls[0];
    expect(argv.slice(1)).toEqual(['prebuilt-metadata', '--json']);
    expect(options).toMatchObject({ cwd: '/app', encoding: 'utf8' });
  });
});

describe('resolveExpoModules', () => {
  const resolve = (payload) => {
    execFileSync.mockClear();
    execFileSync.mockReturnValue(JSON.stringify(payload));
    return resolveExpoModules('/app');
  };

  it('returns the resolved modules and the extra pods declared beside them', () => {
    const modules = [{ packageName: 'expo-camera', pods: [] }];
    const extraDependencies = [{ name: 'MyLocalPod', path: '../vendor/MyLocalPod' }];

    expect(resolve({ modules, extraDependencies, coreFeatures: [] })).toEqual({
      modules,
      extraDependencies,
    });
  });

  // Every caller reads `extraDependencies.length`, so it is an array in every shape
  // the CLI answers with.
  it('reports no extra pods when the app declares none', () => {
    expect(resolve({ modules: [] })).toEqual({ modules: [], extraDependencies: [] });
    expect(resolve({ modules: [], extraDependencies: null })).toEqual({
      modules: [],
      extraDependencies: [],
    });
  });

  it('reads the legacy top-level array as modules alone', () => {
    const modules = [{ packageName: 'expo-camera', pods: [] }];

    expect(resolve(modules)).toEqual({ modules, extraDependencies: [] });
  });
});
