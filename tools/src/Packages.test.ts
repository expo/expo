import assert from 'node:assert/strict';
import Module from 'node:module';
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

  it('falls back to the workspace package list for scoped packages without a direct package path', () => {
    const originalResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function (request, parent, isMain, options) {
      if (request === '@expo/ui/package.json') {
        throw new Error('Simulated missing direct package path');
      }
      return originalResolveFilename.call(this, request, parent, isMain, options);
    };

    try {
      const pkg = getPackageByName('@expo/ui');
      assert.ok(pkg);
      assert.equal(pkg.packageName, '@expo/ui');
    } finally {
      Module._resolveFilename = originalResolveFilename;
    }
  });

  it('returns null for an unknown package name', () => {
    assert.equal(getPackageByName('definitely-not-a-real-package'), null);
  });

  it('returns null for third-party scoped packages installed only under node_modules', () => {
    // @babel/core is reachable via the node_modules walk-up but is not a workspace package.
    assert.equal(getPackageByName('@babel/core'), null);
  });
});
