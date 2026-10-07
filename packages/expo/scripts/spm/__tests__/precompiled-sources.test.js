'use strict';

const path = require('path');

/**
 * Every path here is virtual: the monorepo base is the repository's own prebuild output, so
 * a real-filesystem suite would resolve whatever the developer last built there. Tarball
 * extraction needs a real `tar` and is covered in flavored-frameworks.test.js.
 *
 * The plugin's Jest config applies no transform, so `jest.mock` runs in place and may close
 * over `volume`.
 */
const volume = new Set();

jest.mock('fs', () => ({ existsSync: (target) => volume.has(target) }));

const {
  frameworkSource,
  headersXCFrameworkSearchPaths,
  resolveFlavoredFramework,
  resolveHeadersXCFrameworkWithSource,
} = require('../flavored-frameworks');

const ENV = path.join('/virtual', 'precompiled-modules');
const MONOREPO = path.resolve(__dirname, '../../../../precompile/.build');
const MODULE_ROOT = '/virtual/node_modules/expo-modules-core';
const CACHE = '/virtual/cache';

const bases = {
  env: path.join(ENV, 'expo-modules-core', 'output'),
  monorepo: path.join(MONOREPO, 'expo-modules-core', 'output'),
  bundled: path.join(MODULE_ROOT, 'prebuilds', 'output'),
};

const headersAt = (base, product = 'ExpoModulesCore') =>
  path.join(base, 'headers', 'xcframeworks', `${product}Headers.xcframework`);

function addHeaders(base) {
  volume.add(headersAt(base));
  volume.add(path.join(headersAt(base), 'Info.plist'));
}

function addFlavoredPair(base, frameworkName) {
  for (const flavor of ['debug', 'release']) {
    const xcframework = path.join(base, flavor, 'xcframeworks', `${frameworkName}.xcframework`);
    volume.add(xcframework);
    volume.add(path.join(xcframework, 'Info.plist'));
  }
}

const lookup = { packageName: 'expo-modules-core', moduleRoot: MODULE_ROOT, cacheDir: CACHE };

describe('precompiled source kinds', () => {
  const savedEnv = process.env.EXPO_PRECOMPILED_MODULES_PATH;

  beforeEach(() => {
    volume.clear();
    process.env.EXPO_PRECOMPILED_MODULES_PATH = ENV;
  });

  afterAll(() => {
    if (savedEnv == null) {
      delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
    } else {
      process.env.EXPO_PRECOMPILED_MODULES_PATH = savedEnv;
    }
  });

  it.each(['env', 'monorepo', 'bundled'])(
    'records that a flavored framework came from the %s base',
    (kind) => {
      addFlavoredPair(bases[kind], 'ExpoModulesCore');
      const framework = resolveFlavoredFramework({ ...lookup, frameworkName: 'ExpoModulesCore' });
      expect(frameworkSource(framework)).toEqual({ kind, dir: bases[kind] });
    }
  );

  it('keeps the flavored declaration React Native receives free of the source', () => {
    addFlavoredPair(bases.env, 'ExpoModulesCore');
    const framework = resolveFlavoredFramework({ ...lookup, frameworkName: 'ExpoModulesCore' });
    expect(Object.keys(framework).sort()).toEqual(['flavors', 'frameworkName', 'id', 'linkage']);
  });

  it('prefers EXPO_PRECOMPILED_MODULES_PATH, then the monorepo, then the npm package', () => {
    for (const base of Object.values(bases)) addHeaders(base);
    const headers = () =>
      resolveHeadersXCFrameworkWithSource({ ...lookup, productName: 'ExpoModulesCore' });

    expect(headers()).toEqual({
      xcframework: headersAt(bases.env),
      source: { kind: 'env', dir: bases.env },
    });
    volume.delete(headersAt(bases.env));
    expect(headers()).toEqual({
      xcframework: headersAt(bases.monorepo),
      source: { kind: 'monorepo', dir: bases.monorepo },
    });
    volume.delete(headersAt(bases.monorepo));
    expect(headers()).toEqual({
      xcframework: headersAt(bases.bundled),
      source: { kind: 'bundled', dir: bases.bundled },
    });
  });

  it('skips EXPO_PRECOMPILED_MODULES_PATH when it is unset', () => {
    delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
    addHeaders(bases.monorepo);
    expect(
      resolveHeadersXCFrameworkWithSource({ ...lookup, productName: 'ExpoModulesCore' }).source.kind
    ).toBe('monorepo');
  });

  it('returns null when no base has the headers, and names every path it searched', () => {
    addFlavoredPair(bases.env, 'ExpoModulesCore');
    expect(
      resolveHeadersXCFrameworkWithSource({ ...lookup, productName: 'ExpoModulesCore' })
    ).toBeNull();
    const tarball = (base) =>
      path.join(base, 'headers', 'xcframeworks', 'ExpoModulesCoreHeaders.tar.gz');
    expect(headersXCFrameworkSearchPaths({ ...lookup, productName: 'ExpoModulesCore' })).toEqual([
      headersAt(bases.env),
      tarball(bases.env),
      headersAt(bases.monorepo),
      tarball(bases.monorepo),
      headersAt(bases.bundled),
      tarball(bases.bundled),
    ]);
  });

  it('searches no npm package when the package is not installed', () => {
    const paths = headersXCFrameworkSearchPaths({
      packageName: 'expo-modules-jsi',
      moduleRoot: null,
      productName: 'ExpoModulesJSI',
    });
    expect(paths).toHaveLength(4);
    expect(paths.every((p) => p.startsWith(ENV) || p.startsWith(MONOREPO))).toBe(true);
  });
});
