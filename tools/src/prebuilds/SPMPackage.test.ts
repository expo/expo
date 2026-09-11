import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import type { SPMProduct, SwiftTarget } from './SPMConfig.types';
import {
  buildSwiftSettings,
  expandTransitiveExternalDeps,
  findSiblingProductDependencies,
  type ExternalDepResolver,
} from './SPMPackage';

/** Builds an ArtifactPaths fixture whose React cache slot we then populate per-format. */
function makeArtifactPaths(cachePath: string, version: string) {
  return {
    hermes: path.join(cachePath, 'hermes'),
    reactNativeDependencies: path.join(cachePath, 'deps'),
    react: path.join(cachePath, 'react', version, 'debug'),
    cachePath,
    hermesVersion: '1.0.0',
    reactNativeVersion: version,
  };
}

function makeProduct(name: string, targetDeps: string[] = []): SPMProduct {
  return {
    name,
    podName: name,
    platforms: ['iOS(.v15)'],
    targets: [
      {
        type: 'swift' as const,
        name,
        path: 'ios',
        pattern: '**/*.swift',
        dependencies: targetDeps,
      },
    ],
  };
}

describe('findSiblingProductDependencies', () => {
  it('returns empty when product has no target dependencies', () => {
    const product = makeProduct('ExpoCamera');
    const all = [product, makeProduct('Other')];
    assert.deepEqual(findSiblingProductDependencies(product, all), []);
  });

  it('returns empty when dependencies are not sibling products', () => {
    const product = makeProduct('ExpoCamera', ['ZXingObjC', 'ExpoModulesCore']);
    const all = [product];
    assert.deepEqual(findSiblingProductDependencies(product, all), []);
  });

  it('detects a sibling product dependency', () => {
    const camera = makeProduct('ExpoCamera');
    const scanner = makeProduct('ExpoCameraBarcodeScanning', ['ExpoCamera', 'ZXingObjC']);
    const all = [camera, scanner];
    assert.deepEqual(findSiblingProductDependencies(scanner, all), ['ExpoCamera']);
  });

  it('does not include self as a sibling', () => {
    const product = makeProduct('ExpoCamera', ['ExpoCamera']);
    const all = [product];
    assert.deepEqual(findSiblingProductDependencies(product, all), []);
  });

  it('deduplicates across multiple targets', () => {
    const product: SPMProduct = {
      name: 'Scanner',
      podName: 'Scanner',
      platforms: ['iOS(.v15)'],
      targets: [
        {
          type: 'swift',
          name: 'ScannerSwift',
          path: 'ios',
          pattern: '**/*.swift',
          dependencies: ['Core'],
        },
        {
          type: 'objc',
          name: 'ScannerObjC',
          path: 'ios',
          pattern: '**/*.m',
          dependencies: ['Core'],
        },
      ],
    };
    const all = [makeProduct('Core'), product];
    assert.deepEqual(findSiblingProductDependencies(product, all), ['Core']);
  });
});

// Synthetic resolver for tests. Keys map a `package/Product` to its further
// externalDeps; anything not in the map resolves to null (matching production).
const makeResolver =
  (graph: Record<string, string[]>): ExternalDepResolver =>
  (dep) =>
    dep in graph ? graph[dep] : null;

describe('expandTransitiveExternalDeps', () => {
  it('passes through and deduplicates leaf-only seeds', () => {
    assert.deepEqual(
      expandTransitiveExternalDeps(['A', 'B', 'A', 'C', 'B'], () => null),
      ['A', 'B', 'C']
    );
  });

  it('walks transitive deps across multiple levels', () => {
    const resolver = makeResolver({
      'pkg-a/A': ['pkg-b/B', 'Hermes'],
      'pkg-b/B': ['pkg-c/C'],
      'pkg-c/C': ['Hermes'], // dup with seed-derived Hermes — must dedup
    });
    assert.deepEqual(expandTransitiveExternalDeps(['pkg-a/A'], resolver), [
      'pkg-a/A',
      'pkg-b/B',
      'Hermes',
      'pkg-c/C',
    ]);
  });

  it('terminates on cycles', () => {
    const resolver = makeResolver({ 'pkg-a/A': ['pkg-b/B'], 'pkg-b/B': ['pkg-a/A'] });
    assert.deepEqual(expandTransitiveExternalDeps(['pkg-a/A'], resolver), ['pkg-a/A', 'pkg-b/B']);
  });
});

describe('buildSwiftSettings ExpoModulesMacros plugin flags', () => {
  const makeSwiftTarget = (name: string): SwiftTarget => ({
    type: 'swift',
    name,
    path: 'ios',
    pattern: '**/*.swift',
  });

  const hasMacroPluginFlags = (settings: string[]): boolean =>
    settings.some(
      (line) => line.includes('-load-plugin-executable') && line.includes('#ExpoModulesMacros')
    );

  const macroToolPathSegment = path.join(
    'node_modules',
    '@expo',
    'expo-modules-macros-plugin',
    'apple',
    'ExpoModulesMacros-tool'
  );

  it('should emit load-plugin-executable flags for the ExpoModulesCore swift target', () => {
    const settings = buildSwiftSettings(
      ['ReactNativeDependencies', 'React', 'Hermes', 'expo-modules-jsi/ExpoModulesJSI'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoModulesCore')
    );
    assert.ok(
      hasMacroPluginFlags(settings),
      `expected macro plugin flags in swiftSettings, got:\n${settings.join('\n')}`
    );
    assert.ok(
      settings.some((line) => line.includes(macroToolPathSegment)),
      `expected macro plugin executable path in swiftSettings, got:\n${settings.join('\n')}`
    );
  });

  it('should emit load-plugin-executable flags for a target that depends directly on ExpoModulesCore', () => {
    const settings = buildSwiftSettings(
      ['Hermes', 'React', 'ExpoModulesCore'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoModulesWorklets')
    );
    assert.ok(hasMacroPluginFlags(settings));
  });

  it('should emit load-plugin-executable flags for a target that depends on ExpoModulesCore via the cross-package form', () => {
    const settings = buildSwiftSettings(
      ['Hermes', 'expo-modules-core/ExpoModulesCore'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoCrypto')
    );
    assert.ok(hasMacroPluginFlags(settings));
  });

  it('should not emit load-plugin-executable flags for a target unrelated to ExpoModulesCore', () => {
    const settings = buildSwiftSettings(
      ['Hermes', 'React', 'ReactNativeDependencies'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoModulesJSI')
    );
    assert.equal(hasMacroPluginFlags(settings), false);
  });

  it('should not emit load-plugin-executable flags when no swift target is provided', () => {
    const settings = buildSwiftSettings(['ExpoModulesCore'], null, '/tmp/pkg', 'Debug');
    assert.equal(hasMacroPluginFlags(settings), false);
  });
});

/**
 * Recovers the clang command line a settings array produces: the rendered form is
 * `.unsafeFlags(["-Xcc", "-I", "-Xcc", "/path"], …)`, so take the quoted tokens and drop the
 * `-Xcc` separators the Swift compiler needs but clang never sees.
 */
function clangFlagsOf(settings: string[]): string {
  return [...settings.join(' ').matchAll(/"([^"]*)"/g)]
    .map((match) => match[1])
    .filter((flag) => flag !== '-Xcc')
    .join(' ');
}

describe('React header flags: modular module map', () => {
  const version = '1000.0.0';
  const tmpDirs: string[] = [];

  afterEach(() => {
    while (tmpDirs.length) {
      fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
    }
  });

  /** Creates an empty debug slot of the React artifact cache; tests fill it in per case. */
  function makeReactCache(): { cachePath: string; debugBase: string } {
    const cachePath = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-react-flags-'));
    tmpDirs.push(cachePath);
    const debugBase = path.join(cachePath, 'react', version, 'debug');
    fs.mkdirSync(debugBase, { recursive: true });
    return { cachePath, debugBase };
  }

  /** Writes the headers-only sidecar a 0.87+ artifact ships, and returns its headers dir. */
  function writeModularHeaders(basePath: string): string {
    const headersDir = path.join(
      basePath,
      'ReactNativeHeaders.xcframework',
      'ios-arm64',
      'Headers'
    );
    fs.mkdirSync(headersDir, { recursive: true });
    fs.writeFileSync(
      path.join(headersDir, 'module.modulemap'),
      'module ReactNativeHeaders_react {}'
    );
    return headersDir;
  }

  it('emits the module map and headers dir of ReactNativeHeaders.xcframework, and nothing from React.xcframework', () => {
    const { cachePath, debugBase } = makeReactCache();
    const headersDir = writeModularHeaders(debugBase);

    const settings = buildSwiftSettings(
      ['React'],
      makeArtifactPaths(cachePath, version),
      path.join(cachePath, 'pkg'),
      'Debug'
    );
    const clangFlags = clangFlagsOf(settings);

    // clang requires the joined form `-fmodule-map-file=<path>`; the space-separated variant errors.
    assert.ok(
      clangFlags.includes(`-fmodule-map-file=${path.join(headersDir, 'module.modulemap')}`),
      `missing module map flag in: ${clangFlags}`
    );
    assert.ok(
      clangFlags.includes(`-I ${headersDir}`),
      `missing include path for the modular headers dir in: ${clangFlags}`
    );
    // React.xcframework is a binary target, not a header root: any include into it means the
    // lowercase `react/`, `yoga/` namespaces resolve non-modularly again.
    assert.ok(
      !clangFlags.includes('React.xcframework'),
      `unexpected React.xcframework include root in: ${clangFlags}`
    );
  });

  it('throws when a downloaded React artifact has no ReactNativeHeaders.xcframework', () => {
    const { cachePath, debugBase } = makeReactCache();

    assert.throws(
      () =>
        buildSwiftSettings(
          ['React'],
          makeArtifactPaths(cachePath, version),
          path.join(cachePath, 'pkg'),
          'Debug'
        ),
      (error: Error) =>
        error.message.includes(debugBase) &&
        error.message.includes('ReactNativeHeaders.xcframework')
    );
  });

  it('ignores a flavor whose slot exists but is still being extracted', () => {
    const { cachePath, debugBase } = makeReactCache();
    const headersDir = writeModularHeaders(debugBase);

    // downloadArtifactAsync mkdirs the flavor slot before extracting into it, and the pipeline
    // downloads flavors concurrently, so the release slot can exist and be empty while Debug
    // generates. An interrupted download leaves the same state permanently.
    fs.mkdirSync(path.join(cachePath, 'react', version, 'release'), { recursive: true });

    const settings = buildSwiftSettings(
      ['React'],
      makeArtifactPaths(cachePath, version),
      path.join(cachePath, 'pkg'),
      'Debug'
    );
    const clangFlags = clangFlagsOf(settings);
    assert.ok(
      clangFlags.includes(`-fmodule-map-file=${path.join(headersDir, 'module.modulemap')}`),
      `missing module map flag for the built flavor in: ${clangFlags}`
    );
    assert.ok(
      clangFlags.includes(`-I ${headersDir}`),
      `missing include path for the built flavor in: ${clangFlags}`
    );
  });

  it('ignores a flavor that was never downloaded', () => {
    const { cachePath, debugBase } = makeReactCache();
    writeModularHeaders(debugBase);

    // `et prebuild --flavor Debug` only populates the debug slot; the absent release slot must
    // not fail the build it never takes part in.
    const settings = buildSwiftSettings(
      ['React'],
      makeArtifactPaths(cachePath, version),
      path.join(cachePath, 'pkg'),
      'Debug'
    );
    const clangFlags = clangFlagsOf(settings);
    assert.ok(
      !clangFlags.includes(`${version}/release`),
      `unexpected release flavor flags in: ${clangFlags}`
    );
  });
});
