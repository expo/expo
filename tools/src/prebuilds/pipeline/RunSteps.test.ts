/**
 * Tests for RunSteps helper functions:
 *  - resolveFlavorTemplatedPath
 *  - sortPackagesByDependencies
 *  - collectSharedSPMDependencies
 *  - expandWithUnbuiltDependencies (with mocked fs/getPackageByName)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  resolveFlavorTemplatedPath,
  sortPackagesByDependencies,
  collectSharedSPMDependencies,
  CACHE_DEPS,
} from './RunSteps';
import type { SPMPackageSource } from '../ExternalPackage';
import type { SPMProduct, SPMPackageDependencyConfig } from '../SPMConfig.types';

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

function makeSourceOnlyProduct(name: string, externalDeps: string[] = []): SPMProduct {
  return { ...makeProduct(name, externalDeps), sourceOnly: true };
}

// ---------------------------------------------------------------------------
// resolveFlavorTemplatedPath
// ---------------------------------------------------------------------------

describe('resolveFlavorTemplatedPath', () => {
  it('returns undefined for undefined input', () => {
    assert.equal(resolveFlavorTemplatedPath(undefined, 'Debug'), undefined);
  });

  it('returns path unchanged when no placeholder', () => {
    assert.equal(
      resolveFlavorTemplatedPath('/path/to/file.tar.gz', 'Debug'),
      '/path/to/file.tar.gz'
    );
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
    const { sorted } = sortPackagesByDependencies([a, b]);
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['a', 'b']
    );
  });

  it('sorts linear chain: A depends on B → B first', () => {
    const productA = makeProduct('ProductA', ['b/ProductB']);
    const productB = makeProduct('ProductB');
    const a = makePkg('a', [productA]);
    const b = makePkg('b', [productB]);
    const { sorted } = sortPackagesByDependencies([a, b]);
    assert.deepEqual(
      sorted.map((p) => p.packageName),
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
    const { sorted } = sortPackagesByDependencies([c, b, a]);
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['a', 'b', 'c']
    );
  });

  it('handles circular dependency — warns and returns original order', () => {
    const productA = makeProduct('ProductA', ['b/ProductB']);
    const productB = makeProduct('ProductB', ['a/ProductA']);
    const a = makePkg('a', [productA]);
    const b = makePkg('b', [productB]);
    const { sorted } = sortPackagesByDependencies([a, b]);
    // On circular dep, returns original Map iteration order (insertion order)
    assert.equal(sorted.length, 2);
    // Both packages should be in the result
    const names = sorted.map((p) => p.packageName);
    assert.ok(names.includes('a'));
    assert.ok(names.includes('b'));
  });

  it('deduplicates by packageName', () => {
    const a = makePkg('a', [makeProduct('A')]);
    const { sorted } = sortPackagesByDependencies([a]);
    assert.equal(sorted.length, 1);
  });

  it('handles scoped package deps: @expo/ui/ExpoUI', () => {
    const productA = makeProduct('ProductA', ['@expo/ui/ExpoUI']);
    const productUI = makeProduct('ExpoUI');
    const a = makePkg('a', [productA]);
    const ui = makePkg('@expo/ui', [productUI]);
    const { sorted } = sortPackagesByDependencies([a, ui]);
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['@expo/ui', 'a']
    );
  });

  it('ignores deps not in build set', () => {
    const productA = makeProduct('ProductA', ['not-in-set/Something']);
    const a = makePkg('a', [productA]);
    const { sorted } = sortPackagesByDependencies([a]);
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['a']
    );
  });

  it('resolves bare product names via product-to-package map', () => {
    // "RNWorklets" is a product name, not a package name
    const productA = makeProduct('ProductA', ['RNWorklets']);
    const productWorklets = makeProduct('RNWorklets');
    const a = makePkg('a', [productA]);
    const worklets = makePkg('react-native-worklets', [productWorklets]);
    const { sorted } = sortPackagesByDependencies([a, worklets]);
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['react-native-worklets', 'a']
    );
  });

  it('skips sourceOnly products when computing dependencies', () => {
    // A source-only companion product (e.g. ExpoModulesWorkletsAdapter) is not
    // built as an xcframework, so its externalDependencies must not influence
    // build order or pull packages into the build graph.
    const builtProduct = makeProduct('Built');
    const adapter = makeSourceOnlyProduct('Adapter', ['external/Worklets']);
    const owner = makePkg('owner', [builtProduct, adapter]);
    const externalPkg = makePkg('external', [makeProduct('Worklets')]);
    const { sorted, dependsOn } = sortPackagesByDependencies([owner, externalPkg]);
    // owner's dependsOn must be empty — the source-only product's deps are ignored
    assert.equal(dependsOn.get('owner')!.size, 0);
    // No cycle and no forced ordering: insertion order preserved
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['owner', 'external']
    );
  });

  it('ignores intra-package product references (no self-cycle)', () => {
    // A package with multiple products where one product depends on another
    // product in the same package must NOT register as a self-dependency.
    const productMain = makeProduct('Main');
    const productExtra = makeProduct('Extra', ['Main']); // bare product name in same package
    const pkg = makePkg('multi-product', [productMain, productExtra]);
    const consumer = makePkg('consumer', [makeProduct('Consumer', ['multi-product/Main'])]);
    const { sorted, dependsOn } = sortPackagesByDependencies([consumer, pkg]);
    // multi-product depends on itself only via intra-package product → must be empty
    assert.equal(dependsOn.get('multi-product')!.size, 0);
    // consumer depends on multi-product
    assert.deepEqual([...dependsOn.get('consumer')!], ['multi-product']);
    // No cycle → multi-product sorted first, then consumer
    assert.deepEqual(
      sorted.map((p) => p.packageName),
      ['multi-product', 'consumer']
    );
  });

  it('returns dependsOn map with correct dependencies', () => {
    const productA = makeProduct('ProductA', ['b/ProductB']);
    const productB = makeProduct('ProductB');
    const a = makePkg('a', [productA]);
    const b = makePkg('b', [productB]);
    const { dependsOn } = sortPackagesByDependencies([a, b]);
    assert.deepEqual([...dependsOn.get('a')!], ['b']);
    assert.equal(dependsOn.get('b')!.size, 0);
  });

  it('returns empty dependsOn sets for independent packages', () => {
    const a = makePkg('a', [makeProduct('A')]);
    const b = makePkg('b', [makeProduct('B')]);
    const { dependsOn } = sortPackagesByDependencies([a, b]);
    assert.equal(dependsOn.get('a')!.size, 0);
    assert.equal(dependsOn.get('b')!.size, 0);
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

// ---------------------------------------------------------------------------
// collectSharedSPMDependencies
// ---------------------------------------------------------------------------

function makeSPMDep(
  productName: string,
  url: string = `https://github.com/example/${productName}.git`
): SPMPackageDependencyConfig {
  return { url, productName, version: { exact: '1.0.0' } };
}

function makeProductWithSPMDeps(
  name: string,
  spmPackages: SPMPackageDependencyConfig[]
): SPMProduct {
  return {
    name,
    podName: name,
    platforms: ['iOS(.v15)'],
    targets: [],
    spmPackages,
  };
}

describe('collectSharedSPMDependencies', () => {
  it('returns empty array when no packages have spmPackages', () => {
    const a = makePkg('a', [makeProduct('A')]);
    const result = collectSharedSPMDependencies([a]);
    assert.deepEqual(result, []);
  });

  it('collects SPM deps from a single package', () => {
    const sdwebimage = makeSPMDep('SDWebImage');
    const product = makeProductWithSPMDeps('ExpoImage', [sdwebimage]);
    const a = makePkg('expo-image', [product]);
    const result = collectSharedSPMDependencies([a]);
    assert.equal(result.length, 1);
    assert.equal(result[0].dep.productName, 'SDWebImage');
    assert.deepEqual(result[0].usedBy, ['expo-image']);
  });

  it('deduplicates overlapping SPM deps across packages', () => {
    const sdwebimage1 = makeSPMDep('SDWebImage');
    const sdwebimage2 = makeSPMDep('SDWebImage');
    const lottie = makeSPMDep('Lottie');

    const productA = makeProductWithSPMDeps('ExpoImage', [sdwebimage1, lottie]);
    const productB = makeProductWithSPMDeps('ExpoImageManipulator', [sdwebimage2]);

    const a = makePkg('expo-image', [productA]);
    const b = makePkg('expo-image-manipulator', [productB]);

    const result = collectSharedSPMDependencies([a, b]);
    const names = result.map((d) => d.dep.productName);
    assert.equal(names.length, 2);
    assert.ok(names.includes('SDWebImage'));
    assert.ok(names.includes('Lottie'));

    // SDWebImage should be used by both packages
    const sdwebimageEntry = result.find((d) => d.dep.productName === 'SDWebImage')!;
    assert.deepEqual(sdwebimageEntry.usedBy, ['expo-image', 'expo-image-manipulator']);
    // Lottie only by expo-image
    const lottieEntry = result.find((d) => d.dep.productName === 'Lottie')!;
    assert.deepEqual(lottieEntry.usedBy, ['expo-image']);
  });

  it('first encountered version wins for duplicate deps', () => {
    const v1 = makeSPMDep('SDWebImage', 'https://github.com/SDWebImage/SDWebImage.git');
    (v1.version as any).exact = '5.21.6';
    const v2 = makeSPMDep('SDWebImage', 'https://github.com/SDWebImage/SDWebImage.git');
    (v2.version as any).exact = '5.14.0';

    const productA = makeProductWithSPMDeps('ExpoImage', [v1]);
    const productB = makeProductWithSPMDeps('ExpoImageManipulator', [v2]);

    const a = makePkg('expo-image', [productA]);
    const b = makePkg('expo-image-manipulator', [productB]);

    const result = collectSharedSPMDependencies([a, b]);
    assert.equal(result.length, 1);
    assert.equal((result[0].dep.version as any).exact, '5.21.6');
    assert.deepEqual(result[0].usedBy, ['expo-image', 'expo-image-manipulator']);
  });

  it('handles packages with getSwiftPMConfiguration errors gracefully', () => {
    const sdwebimage = makeSPMDep('SDWebImage');
    const product = makeProductWithSPMDeps('ExpoImage', [sdwebimage]);
    const a = makePkg('expo-image', [product]);
    const broken = makePkg('broken', [], {
      getSwiftPMConfiguration: () => {
        throw new Error('no config');
      },
    });

    const result = collectSharedSPMDependencies([broken, a]);
    assert.equal(result.length, 1);
    assert.equal(result[0].dep.productName, 'SDWebImage');
    assert.deepEqual(result[0].usedBy, ['expo-image']);
  });
});
