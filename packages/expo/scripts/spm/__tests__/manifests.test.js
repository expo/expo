'use strict';

const {
  parseDumpedManifest,
  renderSourceManifest,
  renderPureSwiftManifest,
} = require('../manifests');

describe('parseDumpedManifest', () => {
  const dumped = JSON.stringify({
    name: 'expo-file-system',
    products: [
      { name: 'ExpoFileSystem', type: { library: ['automatic'] }, targets: ['ExpoFileSystem', 'ExpoFileSystemObjC'] },
      { name: 'ExpoFileSystemExecutable', type: { executable: [] }, targets: ['CLI'] },
    ],
    targets: [
      {
        name: 'ExpoFileSystem',
        type: 'regular',
        path: 'ios/ExpoFileSystem',
        dependencies: [{ byName: ['ExpoFileSystemObjC', null] }],
      },
      { name: 'ExpoFileSystemObjC', type: 'regular', path: 'ios/ExpoFileSystemObjC', publicHeadersPath: 'include', dependencies: [] },
      { name: 'ExpoFileSystemTests', type: 'test', path: 'ios/Tests', dependencies: [] },
    ],
  });

  it('keeps only regular targets, records path/publicHeadersPath, resolves sibling deps', () => {
    const { name, targets } = parseDumpedManifest(dumped);
    expect(name).toBe('expo-file-system');
    expect(targets).toEqual([
      { name: 'ExpoFileSystem', path: 'ios/ExpoFileSystem', publicHeadersPath: null, siblingDeps: ['ExpoFileSystemObjC'] },
      { name: 'ExpoFileSystemObjC', path: 'ios/ExpoFileSystemObjC', publicHeadersPath: 'include', siblingDeps: [] },
    ]);
  });

  it('keeps only library products and drops product targets not present as regular targets', () => {
    const { products } = parseDumpedManifest(dumped);
    expect(products).toEqual([
      { name: 'ExpoFileSystem', targets: ['ExpoFileSystem', 'ExpoFileSystemObjC'] },
    ]);
  });
});

describe('renderSourceManifest', () => {
  const manifest = {
    name: 'expo-file-system',
    products: [{ name: 'ExpoFileSystem', targets: ['ExpoFileSystem', 'ExpoFileSystemObjC'] }],
    targets: [
      { name: 'ExpoFileSystem', path: 'ios/ExpoFileSystem', publicHeadersPath: null, siblingDeps: ['ExpoFileSystemObjC'] },
      { name: 'ExpoFileSystemObjC', path: 'ios/ExpoFileSystemObjC', publicHeadersPath: 'include', siblingDeps: [] },
    ],
  };
  const out = renderSourceManifest(
    manifest,
    ['.package(name: "ReactNative", path: "/abs/rn")'],
    ['.product(name: "ReactHeaders", package: "ReactNative")'],
    '/abs/interfaces'
  );

  it('mirrors targets with sibling deps first, then injected deps', () => {
    expect(out).toContain('name: "ExpoFileSystem"');
    expect(out).toContain('"ExpoFileSystemObjC",\n                .product(name: "ReactHeaders", package: "ReactNative")');
    expect(out).toContain('path: "root/ios/ExpoFileSystem"');
  });

  it('emits publicHeadersPath only for targets that declare it', () => {
    expect(out).toContain('path: "root/ios/ExpoFileSystemObjC",\n            publicHeadersPath: "include",');
    // the Swift target has no publicHeadersPath line
    expect(out).not.toContain('path: "root/ios/ExpoFileSystem",\n            publicHeadersPath:');
  });

  it('always emits the Swift-5 language mode + C++20 tail (folly needs C++17+)', () => {
    expect(out).toContain('swiftLanguageModes: [.v5],\n    cxxLanguageStandard: .cxx20');
  });

  it('uses the compile-only interface tree and never emits a binary target', () => {
    expect(out).toContain('swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).toContain('cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).not.toContain('.binaryTarget');
    expect(out).not.toContain('ExpoModulesCore.xcframework');
  });
});

describe('renderPureSwiftManifest', () => {
  const out = renderPureSwiftManifest(
    'ExpoAsset',
    'ios',
    [],
    [],
    '/abs/interfaces'
  );

  it('emits a single target over the source dir with the given deps', () => {
    expect(out).toContain('.library(name: "ExpoAsset", targets: ["ExpoAsset"])');
    expect(out).toContain('path: "root/ios"');
    expect(out).toContain('swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).not.toContain('.binaryTarget');
    expect(out).not.toMatch(/\[\s*,\s*\]/);
    expect(out).toContain('swiftLanguageModes: [.v5],\n    cxxLanguageStandard: .cxx20');
  });
});
