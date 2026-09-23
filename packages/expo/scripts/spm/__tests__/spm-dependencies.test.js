'use strict';

const path = require('path');

/**
 * Every path here is virtual. The resolver searches the monorepo's own prebuild
 * output, so a suite that touched the real filesystem would resolve whatever the
 * developer last built — and would have to write into the repository to cover
 * that base at all. `fs` is mocked instead, over paths this file declares.
 *
 * `plutil` is macOS-only, so `child_process` is mocked too; the fixtures store
 * their plists as the JSON it would print, which is why these tests live apart
 * from flavored-frameworks.test.js, whose tarball fixtures need a real `tar`.
 *
 * The plugin's Jest config applies no transform, so these `jest.mock` calls run
 * in place rather than being hoisted, and may close over `volume`.
 */
const volume = new Map(); // absolute path → file contents, or null for a directory
const unreadable = new Set(); // paths `statSync` refuses with EACCES

jest.mock('fs', () => ({
  existsSync: (target) => volume.has(target),
  statSync: (target) => {
    if (unreadable.has(target)) {
      throw Object.assign(new Error(`EACCES: permission denied, stat '${target}'`), {
        code: 'EACCES',
      });
    }
    if (!volume.has(target)) {
      throw Object.assign(new Error(`ENOENT: ${target}`), { code: 'ENOENT' });
    }
    return { isDirectory: () => volume.get(target) === null };
  },
}));
jest.mock('child_process', () => ({ execFileSync: jest.fn() }));

const { execFileSync } = require('child_process');

const {
  assertDistinctFlavoredFrameworks,
  resolveSpmDependencyFrameworks,
} = require('../flavored-frameworks');

const OVERRIDE = path.join('/virtual', 'precompiled-modules');
const MONOREPO_SPM_DEPS = path.resolve(__dirname, '../../../../precompile/.build/.spm-deps');
const IMAGE_ROOT = '/virtual/expo-image';

const overrideBase = (depName) => path.join(OVERRIDE, '.spm-deps', depName);
const monorepoBase = (depName) => path.join(MONOREPO_SPM_DEPS, depName);
const bundledBase = (moduleRoot, depName) =>
  path.join(moduleRoot, 'prebuilds', 'spm-deps', depName);

/** An XCFramework directory whose Info.plist is whatever `plutil` would print. */
function dependencyArtifact(baseDir, depName, flavor, plist) {
  const xcframework = path.join(baseDir, flavor, `${depName}.xcframework`);
  volume.set(xcframework, null);
  volume.set(path.join(xcframework, 'Info.plist'), plist);
  return xcframework;
}

function dependencyXcframework(baseDir, depName, flavor, libraryPaths = [`${depName}.framework`]) {
  return dependencyArtifact(
    baseDir,
    depName,
    flavor,
    JSON.stringify({
      AvailableLibraries: libraryPaths.map((libraryPath, index) => ({
        LibraryIdentifier: `ios-arm64-${index}`,
        ...(libraryPath != null && { LibraryPath: libraryPath }),
      })),
    })
  );
}

const bothFlavors = (baseDir, depName, libraryPaths) => ({
  debug: dependencyXcframework(baseDir, depName, 'debug', libraryPaths),
  release: dependencyXcframework(baseDir, depName, 'release', libraryPaths),
});

/** A leftover regular file where an XCFramework directory belongs. */
function dependencyFile(baseDir, depName, flavor) {
  const target = path.join(baseDir, flavor, `${depName}.xcframework`);
  volume.set(target, 'not a directory');
  return target;
}

const consumer = (podName, moduleRoot, spmDependencies) => ({
  podName,
  moduleRoot,
  spmDependencies,
});

const resolveLibavif = () =>
  resolveSpmDependencyFrameworks([consumer('ExpoImage', IMAGE_ROOT, ['libavif'])]);

const declaration = (id, frameworkName) => ({
  id,
  frameworkName,
  linkage: 'dynamic',
  flavors: {
    debug: `/virtual/${frameworkName}-debug/${frameworkName}.xcframework`,
    release: `/virtual/${frameworkName}-release/${frameworkName}.xcframework`,
  },
});

describe('shared SwiftPM dependency frameworks', () => {
  let oldOverride;

  beforeEach(() => {
    volume.clear();
    unreadable.clear();
    oldOverride = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = OVERRIDE;
    execFileSync.mockImplementation((file, args) => volume.get(args[args.length - 1]));
  });

  afterEach(() => {
    if (oldOverride == null) {
      delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
    } else {
      process.env.EXPO_PRECOMPILED_MODULES_PATH = oldOverride;
    }
    execFileSync.mockReset();
  });

  it('declares one paired dynamic framework per dependency a precompiled module links', () => {
    const web = bothFlavors(overrideBase('SDWebImage'), 'SDWebImage');
    const avif = bothFlavors(overrideBase('libavif'), 'libavif');

    // Declared in byte order, as CocoaPods sorts them, whatever order they arrive in.
    expect(
      resolveSpmDependencyFrameworks([consumer('ExpoImage', IMAGE_ROOT, ['libavif', 'SDWebImage'])])
    ).toEqual([
      { id: 'expo-sdweb-image', frameworkName: 'SDWebImage', linkage: 'dynamic', flavors: web },
      { id: 'expo-libavif', frameworkName: 'libavif', linkage: 'dynamic', flavors: avif },
    ]);
  });

  it('reads both flavors of every XCFramework plist through plutil, never as text', () => {
    const { debug, release } = bothFlavors(overrideBase('SDWebImage'), 'SDWebImage');

    resolveSpmDependencyFrameworks([consumer('ExpoImage', IMAGE_ROOT, ['SDWebImage'])]);

    for (const xcframework of [debug, release]) {
      expect(execFileSync).toHaveBeenCalledWith(
        'plutil',
        ['-convert', 'json', '-o', '-', path.join(xcframework, 'Info.plist')],
        expect.objectContaining({ encoding: 'utf8' })
      );
    }
  });

  it('declares nothing for a module that links no SwiftPM package', () => {
    expect(
      resolveSpmDependencyFrameworks([consumer('ExpoModulesCore', '/virtual/core', undefined)])
    ).toEqual([]);
  });

  it('declares nothing for a dependency with no artifact under any base', () => {
    expect(resolveLibavif()).toEqual([]);
  });

  it('prefers the path override to the monorepo build tree', () => {
    const flavors = bothFlavors(overrideBase('libavif'), 'libavif');
    bothFlavors(monorepoBase('libavif'), 'libavif');
    bothFlavors(bundledBase(IMAGE_ROOT, 'libavif'), 'libavif');

    expect(resolveLibavif()).toEqual([
      { id: 'expo-libavif', frameworkName: 'libavif', linkage: 'dynamic', flavors },
    ]);
  });

  it('prefers the monorepo build tree to the copy bundled into the owning package', () => {
    delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
    const flavors = bothFlavors(monorepoBase('libavif'), 'libavif');
    bothFlavors(bundledBase(IMAGE_ROOT, 'libavif'), 'libavif');

    expect(resolveLibavif()).toEqual([
      { id: 'expo-libavif', frameworkName: 'libavif', linkage: 'dynamic', flavors },
    ]);
  });

  // Debug resolves in the monorepo build tree, release only in the bundled copy.
  it('resolves each flavor through every base, one flavor at a time', () => {
    const debug = dependencyXcframework(monorepoBase('libavif'), 'libavif', 'debug');
    const release = dependencyXcframework(bundledBase(IMAGE_ROOT, 'libavif'), 'libavif', 'release');

    expect(resolveLibavif()).toEqual([
      {
        id: 'expo-libavif',
        frameworkName: 'libavif',
        linkage: 'dynamic',
        flavors: { debug, release },
      },
    ]);
  });

  it('skips a stale file left where an XCFramework belongs and resolves the real one', () => {
    dependencyFile(overrideBase('libavif'), 'libavif', 'debug');
    dependencyFile(overrideBase('libavif'), 'libavif', 'release');
    const flavors = bothFlavors(bundledBase(IMAGE_ROOT, 'libavif'), 'libavif');

    expect(resolveLibavif()).toEqual([
      { id: 'expo-libavif', frameworkName: 'libavif', linkage: 'dynamic', flavors },
    ]);
  });

  it('rejects a dependency that resolved only one of its two flavors', () => {
    dependencyXcframework(overrideBase('libavif'), 'libavif', 'debug');

    expect(resolveLibavif).toThrow('libavif has no release XCFramework');
    expect(resolveLibavif).toThrow(overrideBase('libavif'));
  });

  it.each([
    ['a dependency shipped as a static library', ['libavif.a'], /libavif\.a/],
    [
      'a dependency whose framework is named after something else',
      ['avif.framework'],
      /avif\.framework/,
    ],
    [
      'an XCFramework whose second slice alone is unusable',
      ['libavif.framework', 'libavif.a'],
      /libavif\.a/,
    ],
    ['an XCFramework that declares no library slices', [], /no library slices/],
    ['an XCFramework whose slice names no library path', [null], /a slice with no LibraryPath/],
  ])('rejects %s', (_, libraryPaths, found) => {
    bothFlavors(overrideBase('libavif'), 'libavif', libraryPaths);

    expect(resolveLibavif).toThrow(
      new RegExp(`libavif does not ship a libavif\\.framework.*${found.source}`, 's')
    );
  });

  it('rejects a dependency whose release flavor alone is a static library', () => {
    dependencyXcframework(overrideBase('libavif'), 'libavif', 'debug');
    const release = dependencyXcframework(overrideBase('libavif'), 'libavif', 'release', [
      'libavif.a',
    ]);

    expect(resolveLibavif).toThrow(release);
  });

  it('rejects an XCFramework whose slice list is not a list', () => {
    const plist = JSON.stringify({ AvailableLibraries: { 'ios-arm64': 'libavif.framework' } });
    dependencyArtifact(overrideBase('libavif'), 'libavif', 'debug', plist);
    dependencyArtifact(overrideBase('libavif'), 'libavif', 'release', plist);

    expect(resolveLibavif).toThrow(
      /Info\.plist lists AvailableLibraries as something other than a list of slices/
    );
  });

  it('rejects an Info.plist that does not convert to a property list', () => {
    const debug = dependencyArtifact(
      overrideBase('libavif'),
      'libavif',
      'debug',
      'not a property list'
    );
    dependencyXcframework(overrideBase('libavif'), 'libavif', 'release');

    expect(resolveLibavif).toThrow(
      `[expo-spm-plugin] ${path.join(debug, 'Info.plist')} could not be read`
    );
  });

  it('reports what plutil said when it refuses the Info.plist', () => {
    bothFlavors(overrideBase('libavif'), 'libavif');
    execFileSync.mockImplementation(() => {
      throw new Error('Command failed: plutil\nUnexpected character b at line 1');
    });

    expect(resolveLibavif).toThrow(/could not be read.*Unexpected character b/s);
  });

  it('stops on a base it cannot read, instead of reporting the artifact as missing', () => {
    const blocked = path.join(overrideBase('libavif'), 'debug', 'libavif.xcframework');
    unreadable.add(blocked);
    bothFlavors(bundledBase(IMAGE_ROOT, 'libavif'), 'libavif');

    expect(resolveLibavif).toThrow(`[expo-spm-plugin] ${blocked} could not be read: EACCES`);
  });

  // Pod names are compared byte by byte, as CocoaPods' `consumers.keys.sort` does:
  // an uppercase B sorts before a lowercase a.
  it('declares a dependency two modules share once, owned by the first pod name in byte order', () => {
    const upper = '/virtual/upper';
    const flavors = {
      debug: dependencyXcframework(bundledBase(upper, 'ZXingObjC'), 'ZXingObjC', 'debug'),
      release: dependencyXcframework(bundledBase(upper, 'ZXingObjC'), 'ZXingObjC', 'release'),
    };

    expect(
      resolveSpmDependencyFrameworks([
        consumer('aPod', '/virtual/lower', ['ZXingObjC']),
        consumer('BPod', upper, ['ZXingObjC']),
      ])
    ).toEqual([
      { id: 'expo-zxing-obj-c', frameworkName: 'ZXingObjC', linkage: 'dynamic', flavors },
    ]);
  });

  it('looks for the bundled copy under the owner alone', () => {
    const lower = '/virtual/lower';
    dependencyXcframework(bundledBase(lower, 'ZXingObjC'), 'ZXingObjC', 'debug');
    dependencyXcframework(bundledBase(lower, 'ZXingObjC'), 'ZXingObjC', 'release');

    expect(
      resolveSpmDependencyFrameworks([
        consumer('aPod', lower, ['ZXingObjC']),
        consumer('BPod', '/virtual/upper', ['ZXingObjC']),
      ])
    ).toEqual([]);
  });
});

describe('assertDistinctFlavoredFrameworks', () => {
  it('accepts declarations with distinct ids and framework names', () => {
    expect(() =>
      assertDistinctFlavoredFrameworks([
        declaration('expo-image', 'ExpoImage'),
        declaration('expo-foo', 'Foo'),
      ])
    ).not.toThrow();
  });

  it('rejects two products that collapse onto one framework id', () => {
    expect(() =>
      assertDistinctFlavoredFrameworks([
        declaration('expo-foo', 'ExpoFoo'),
        declaration('expo-foo', 'Foo'),
      ])
    ).toThrow(/ExpoFoo.*Foo.*framework id "expo-foo"/s);
  });

  it('rejects two products that embed under one framework name', () => {
    expect(() =>
      assertDistinctFlavoredFrameworks([declaration('expo-a', 'Foo'), declaration('expo-b', 'Foo')])
    ).toThrow('framework name "Foo"');
  });
});
