/**
 * Tests for ExternalPackage discovery functions.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  discoverExternalPackagesAsync,
  getExternalPackageByName,
  getExternalPackageByProductName,
} from './ExternalPackage';

describe('discoverExternalPackagesAsync', () => {
  it('discovers all external packages with spm.config.json', async () => {
    const packages = await discoverExternalPackagesAsync();
    const names = packages.map((p) => p.packageName).sort();

    assert.ok(packages.length >= 7, `Expected at least 7 packages, got ${packages.length}`);
    assert.ok(names.includes('react-native-screens'), 'Should include react-native-screens');
    assert.ok(names.includes('react-native-svg'), 'Should include react-native-svg');
    assert.ok(names.includes('react-native-reanimated'), 'Should include react-native-reanimated');
    assert.ok(
      names.includes('react-native-safe-area-context'),
      'Should include react-native-safe-area-context'
    );
    assert.ok(names.includes('react-native-worklets'), 'Should include react-native-worklets');
  });
});

describe('getExternalPackageByName', () => {
  it('returns a valid ExternalPackage for react-native-screens', () => {
    const pkg = getExternalPackageByName('react-native-screens');
    assert.ok(pkg, 'Should find react-native-screens');
    assert.equal(pkg.packageName, 'react-native-screens');
  });

  it('returns null for a non-existent package', () => {
    const pkg = getExternalPackageByName('non-existent-package');
    assert.equal(pkg, null);
  });
});

describe('getExternalPackageByProductName', () => {
  it('finds react-native-screens by product name RNScreens', () => {
    const pkg = getExternalPackageByProductName('RNScreens');
    assert.ok(pkg, 'Should find package by product name RNScreens');
    assert.equal(pkg.packageName, 'react-native-screens');
  });

  it('returns null for a non-existent product', () => {
    const pkg = getExternalPackageByProductName('NonExistentProduct');
    assert.equal(pkg, null);
  });
});
