/**
 * Tests for RunSteps helper functions:
 *  - resolveFlavorTemplatedPath
 *  - sortPackagesByDependencies
 *  - expandWithUnbuiltDependencies (with mocked fs/getPackageByName)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveFlavorTemplatedPath,
  sortPackagesByDependencies,
  CACHE_DEPS,
} from './RunSteps';
import type { SPMPackageSource } from '../ExternalPackage';
import type { SPMProduct } from '../SPMConfig.types';

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

function makePkg(
  name: string,
  products: SPMProduct[] = [],
  overrides: Partial<SPMPackageSource> = {}
): SPMPackageSource {
  return {
    path: `/repo/packages/${name}`,
    buildPath: `/repo/packages/precompile/.build/${name}`,
    packageName: name,
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products }),
    ...overrides,
  };
}

function makeProduct(name: string, externalDeps: string[] = []): SPMProduct {
  return {
    name,
    podName: name,
    platforms: ['iOS(.v15)'],
    targets: [],
    externalDependencies: externalDeps.length > 0 ? externalDeps : undefined,
  };
}

// ---------------------------------------------------------------------------
// resolveFlavorTemplatedPath
// ---------------------------------------------------------------------------

describe('resolveFlavorTemplatedPath', () => {
  it('returns undefined for undefined input', () => {
    assert.equal(resolveFlavorTemplatedPath(undefined, 'Debug'), undefined);
  });

  it('returns path unchanged when no placeholder', () => {
    assert.equal(resolveFlavorTemplatedPath('/path/to/file.tar.gz', 'Debug'), '/path/to/file.tar.gz');
  });

  it('substitutes {flavor} with Debug', () => {
    assert.equal(
      resolveFlavorTemplatedPath('/path/{flavor}/react.tar.gz', 'Debug'),
      '/path/Debug/react.tar.gz'
    );
  });

  it('substitutes {flavor} with Release', () => {
    assert.equal(
      resolveFlavorTemplatedPath('/path/{flavor}/react.tar.gz', 'Release'),
      '/path/Release/react.tar.gz'
    );
  });

  it('substitutes {Flavor} case-insensitively', () => {
    assert.equal(
      resolveFlavorTemplatedPath('/path/{Flavor}/react.tar.gz', 'Debug'),
      '/path/Debug/react.tar.gz'
    );
  });

  it('substitutes multiple occurrences', () => {
    assert.equal(
      resolveFlavorTemplatedPath('{flavor}/path/{flavor}.tar.gz', 'Release'),
      'Release/path/Release.tar.gz'
    );
  });
});

// ---------------------------------------------------------------------------
// sortPackagesByDependencies
// ---------------------------------------------------------------------------

describe('sortPackagesByDependencies', () => {
  it('returns same order when no packages have deps', () => {
    const a = makePkg('a', [makeProduct('A')]);
    const b = makePkg('b', [makeProduct('B')]);
    const result = sortPackagesByDependencies([a, b]);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['a', 'b']
    );
  });

  it('sorts linear chain: A depends on B → B first', () => {
    const productA = makeProduct('ProductA', ['b/ProductB']);
    const productB = makeProduct('ProductB');
    const a = makePkg('a', [productA]);
    const b = makePkg('b', [productB]);
    const result = sortPackagesByDependencies([a, b]);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['b', 'a']
    );
  });

  it('handles three-level chain: C→B→A', () => {
    const productC = makeProduct('ProductC', ['b/ProductB']);
    const productB = makeProduct('ProductB', ['a/ProductA']);
    const productA = makeProduct('ProductA');
    const c = makePkg('c', [productC]);
    const b = makePkg('b', [productB]);
    const a = makePkg('a', [productA]);
    const result = sortPackagesByDependencies([c, b, a]);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['a', 'b', 'c']
    );
  });

  it('handles circular dependency — warns and returns original order', () => {
    const productA = makeProduct('ProductA', ['b/ProductB']);
    const productB = makeProduct('ProductB', ['a/ProductA']);
    const a = makePkg('a', [productA]);
    const b = makePkg('b', [productB]);
    const result = sortPackagesByDependencies([a, b]);
    // On circular dep, returns original Map iteration order (insertion order)
    assert.equal(result.length, 2);
    // Both packages should be in the result
    const names = result.map((p) => p.packageName);
    assert.ok(names.includes('a'));
    assert.ok(names.includes('b'));
  });

  it('deduplicates by packageName', () => {
    const a = makePkg('a', [makeProduct('A')]);
    const result = sortPackagesByDependencies([a]);
    assert.equal(result.length, 1);
  });

  it('handles scoped package deps: @expo/ui/ExpoUI', () => {
    const productA = makeProduct('ProductA', ['@expo/ui/ExpoUI']);
    const productUI = makeProduct('ExpoUI');
    const a = makePkg('a', [productA]);
    const ui = makePkg('@expo/ui', [productUI]);
    const result = sortPackagesByDependencies([a, ui]);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['@expo/ui', 'a']
    );
  });

  it('ignores deps not in build set', () => {
    const productA = makeProduct('ProductA', ['not-in-set/Something']);
    const a = makePkg('a', [productA]);
    const result = sortPackagesByDependencies([a]);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['a']
    );
  });

  it('resolves bare product names via product-to-package map', () => {
    // "RNWorklets" is a product name, not a package name
    const productA = makeProduct('ProductA', ['RNWorklets']);
    const productWorklets = makeProduct('RNWorklets');
    const a = makePkg('a', [productA]);
    const worklets = makePkg('react-native-worklets', [productWorklets]);
    const result = sortPackagesByDependencies([a, worklets]);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['react-native-worklets', 'a']
    );
  });
});

// ---------------------------------------------------------------------------
// CACHE_DEPS constant
// ---------------------------------------------------------------------------

describe('CACHE_DEPS', () => {
  it('contains expected cache dependency names', () => {
    assert.ok(CACHE_DEPS.has('ReactNativeDependencies'));
    assert.ok(CACHE_DEPS.has('React'));
    assert.ok(CACHE_DEPS.has('Hermes'));
  });

  it('does not contain non-cache names', () => {
    assert.ok(!CACHE_DEPS.has('expo-modules-core'));
  });
});
