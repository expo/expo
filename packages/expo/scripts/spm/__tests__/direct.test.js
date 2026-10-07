'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../cli', () => ({
  runDumpPackage: jest.fn(() =>
    JSON.stringify({ name: 'ExpoHaptics', products: [{ name: 'ExpoHaptics' }] })
  ),
}));

const { emitDirectPackage, prepareDirectWatchPaths } = require('../direct');

describe('emitDirectPackage', () => {
  const savedBuildDir = process.env.BUILD_DIR;
  let root;
  let outDir;
  let pkgDir;
  let coreHeadersXCFramework;
  let jsiHeadersPkgPath;

  const emit = () =>
    emitDirectPackage({
      moduleRoot: path.join(root, 'expo-haptics'),
      packageName: 'expo-haptics',
      outDir,
      coreHeadersXCFramework,
      jsiHeadersPkgPath,
      macroTool: path.join(root, 'ExpoModulesMacros'),
    });
  const manifest = () => fs.readFileSync(path.join(pkgDir, 'Package.swift'), 'utf8');

  beforeEach(() => {
    delete process.env.BUILD_DIR;
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-emit-'));
    outDir = path.join(root, 'out');
    pkgDir = path.join(outDir, 'direct', 'ExpoModulesCoreHeaders');
    jsiHeadersPkgPath = path.join(outDir, 'ExpoModulesJSIHeaders');
    fs.mkdirSync(path.join(root, 'expo-haptics'));
    coreHeadersXCFramework = path.join(
      root,
      'expo-modules-core',
      'headers',
      'ExpoModulesCoreHeaders.xcframework'
    );
    fs.mkdirSync(coreHeadersXCFramework, { recursive: true });
    fs.writeFileSync(path.join(coreHeadersXCFramework, 'Info.plist'), '<plist/>');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    if (savedBuildDir === undefined) {
      delete process.env.BUILD_DIR;
    } else {
      process.env.BUILD_DIR = savedBuildDir;
    }
  });

  it('declares one product over the ExpoModulesCore headers binary target', () => {
    emit();
    expect(manifest().match(/\.binaryTarget\(/g)).toHaveLength(1);
    expect(manifest()).toContain(
      '.binaryTarget(name: "ExpoModulesCoreHeaders", path: "ExpoModulesCoreHeaders.xcframework")'
    );
    expect(manifest().match(/\.library\(/g)).toHaveLength(1);
    expect(manifest()).toMatch(
      /\.library\(name: "ExpoModulesCoreHeaders", targets: \["ExpoModulesCoreHeaders"/
    );
  });

  // The ExpoModulesJSI headers package declares that target too, and SwiftPM rejects a
  // graph with two targets of one name.
  it('declares no ExpoModulesJSIHeaders target, and depends on the JSI headers package by path', () => {
    emit();
    expect(manifest()).not.toMatch(/\.(binaryTarget|target)\(name: "ExpoModulesJSIHeaders"/);
    expect(manifest()).toContain(
      '.package(name: "ExpoModulesJSIHeaders", path: "../../ExpoModulesJSIHeaders")'
    );
    expect(manifest()).toContain(
      '.product(name: "ExpoModulesJSIHeaders", package: "ExpoModulesJSIHeaders")'
    );
  });

  it('depends on no JSI headers package when there is none', () => {
    jsiHeadersPkgPath = null;
    emit();
    expect(manifest()).not.toContain('ExpoModulesJSIHeaders');
  });

  it('places the ExpoModulesCore headers xcframework in the package by link', () => {
    emit();
    const link = path.join(pkgDir, 'ExpoModulesCoreHeaders.xcframework');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(coreHeadersXCFramework));
    expect(fs.existsSync(path.join(pkgDir, 'ExpoModulesJSIHeaders.xcframework'))).toBe(false);
  });

  it('replaces the xcframework an earlier plugin generated in the package', () => {
    const generated = path.join(pkgDir, 'ExpoModulesCoreHeaders.xcframework');
    fs.mkdirSync(path.join(generated, 'ios-arm64'), { recursive: true });
    emit();
    expect(fs.realpathSync(generated)).toBe(fs.realpathSync(coreHeadersXCFramework));
  });

  it('changes no file in the package when emitted again with the same inputs', () => {
    emit();
    const snapshot = () =>
      fs
        .readdirSync(pkgDir, { recursive: true })
        .sort()
        .map((entry) => {
          const stat = fs.lstatSync(path.join(pkgDir, entry), { bigint: true });
          return [entry, stat.ino, stat.mtimeNs];
        });
    const first = snapshot();
    emit();
    expect(snapshot()).toEqual(first);
  });
});

describe('prepareDirectWatchPaths', () => {
  const savedBuildDir = process.env.BUILD_DIR;
  let outDir;
  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-watch-'));
  });
  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
    if (savedBuildDir === undefined) {
      delete process.env.BUILD_DIR;
    } else {
      process.env.BUILD_DIR = savedBuildDir;
    }
  });

  // Clean Build Folder deletes the macro plugin link while RN's sync stamp survives.
  // A watched path that has vanished makes RN re-sync then.
  it('watches the macro plugin link when a direct module is emitted', () => {
    process.env.BUILD_DIR = '/tmp/Build/Products';
    expect(prepareDirectWatchPaths(['expo-haptics', 'expo-font'], outDir)).toEqual([
      path.join('/tmp/Build/Products', 'ExpoModulesMacros'),
    ]);
  });

  it('watches nothing when no direct module is emitted', () => {
    process.env.BUILD_DIR = '/tmp/Build/Products';
    expect(prepareDirectWatchPaths(['expo-font'], outDir)).toEqual([]);
    delete process.env.BUILD_DIR;
    expect(prepareDirectWatchPaths(['expo-font'], outDir)).toEqual([]);
  });

  // A command-line sync has no BUILD_DIR, so it cannot create the link, yet it writes a
  // fresh stamp. RN keeps only watched paths that exist and re-syncs when one is newer
  // than the stamp, so the marker must exist and stay newer than any later stamp.
  it('forces the next build to sync when sync runs outside a build', () => {
    delete process.env.BUILD_DIR;
    const watched = prepareDirectWatchPaths(['expo-haptics'], outDir);
    expect(watched).toHaveLength(1);
    expect(fs.existsSync(watched[0])).toBe(true);
    expect(fs.statSync(watched[0]).mtimeMs).toBeGreaterThan(Date.now() + 365 * 24 * 3600 * 1000);
  });

  it('removes the marker once no direct module is emitted', () => {
    delete process.env.BUILD_DIR;
    const [marker] = prepareDirectWatchPaths(['expo-haptics'], outDir);
    prepareDirectWatchPaths(['expo-font'], outDir);
    expect(fs.existsSync(marker)).toBe(false);
  });

  it('removes the marker once a sync runs inside a build', () => {
    delete process.env.BUILD_DIR;
    const [marker] = prepareDirectWatchPaths(['expo-haptics'], outDir);
    process.env.BUILD_DIR = '/tmp/Build/Products';
    prepareDirectWatchPaths(['expo-haptics'], outDir);
    expect(fs.existsSync(marker)).toBe(false);
  });
});
