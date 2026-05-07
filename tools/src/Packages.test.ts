import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPackageByName } from './Packages';

describe('getPackageByName', () => {
  it('resolves packages whose directory matches their name', () => {
    const pkg = getPackageByName('expo-router');
    assert.ok(pkg);
    assert.equal(pkg.packageName, 'expo-router');
  });

  it('resolves scoped packages whose directory matches their name', () => {
    const pkg = getPackageByName('@expo/cli');
    assert.ok(pkg);
    assert.equal(pkg.packageName, '@expo/cli');
  });

  it('resolves scoped packages whose directory differs from their name', () => {
    for (const name of ['@expo/ui', '@expo/app-integrity']) {
      const pkg = getPackageByName(name);
      assert.ok(pkg, `${name} should resolve`);
      assert.equal(pkg.packageName, name);
    }
  });

  it('returns null for an unknown package name', () => {
    assert.equal(getPackageByName('definitely-not-a-real-package'), null);
  });
});
