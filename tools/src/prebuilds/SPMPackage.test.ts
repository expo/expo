import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SPMProduct } from './SPMConfig.types';
import {
  expandTransitiveExternalDeps,
  findSiblingProductDependencies,
  type ExternalDepResolver,
} from './SPMPackage';

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
