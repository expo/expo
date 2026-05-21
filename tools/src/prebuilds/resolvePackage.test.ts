/**
 * Tests for resolvePackageFromPnpmStore — uses a tmpdir-mocked pnpm store layout
 * so the suite is hermetic and does not depend on what the live workspace happens
 * to have installed.
 */
import fs from 'fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import { resolvePackageFromPnpmStore } from './resolvePackage';

function withTempStore<T>(fn: (storeRoot: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pnpm-store-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeStoreEntry(storeRoot: string, entryDir: string, packageName: string) {
  const inner = path.join(storeRoot, entryDir, 'node_modules', packageName);
  fs.mkdirSync(inner, { recursive: true });
  fs.writeFileSync(path.join(inner, 'package.json'), '{}');
}

describe('resolvePackageFromPnpmStore', () => {
  it('returns the install when exactly one version satisfies', () => {
    withTempStore((storeRoot) => {
      const entry = 'react-native-safe-area-context@5.7.0_react-native@0.85.3';
      writeStoreEntry(storeRoot, entry, 'react-native-safe-area-context');
      const result = resolvePackageFromPnpmStore('react-native-safe-area-context', '~5.7.0', {
        storeRoot,
      });
      assert.deepEqual(result, {
        version: '5.7.0',
        path: path.join(storeRoot, entry, 'node_modules', 'react-native-safe-area-context'),
      });
    });
  });

  it('returns the highest version when multiple satisfy', () => {
    withTempStore((storeRoot) => {
      writeStoreEntry(storeRoot, 'rn@5.6.2_x', 'rn');
      writeStoreEntry(storeRoot, 'rn@5.7.0_x', 'rn');
      const result = resolvePackageFromPnpmStore('rn', '^5.6.0', { storeRoot });
      assert.equal(result?.version, '5.7.0');
    });
  });

  it('resolves scoped packages via the slash-to-plus encoding', () => {
    withTempStore((storeRoot) => {
      const entry = '@shopify+react-native-skia@2.6.2_x';
      writeStoreEntry(storeRoot, entry, '@shopify/react-native-skia');
      const result = resolvePackageFromPnpmStore('@shopify/react-native-skia', '2.6.2', {
        storeRoot,
      });
      assert.equal(result?.version, '2.6.2');
      assert.ok(result?.path.endsWith(path.join(entry, 'node_modules', '@shopify', 'react-native-skia')));
    });
  });

  it('parses the version correctly for patched entries (patch_hash suffix)', () => {
    withTempStore((storeRoot) => {
      writeStoreEntry(storeRoot, 'rn-reanimated@4.3.1_patch_hash=abc_x', 'rn-reanimated');
      const result = resolvePackageFromPnpmStore('rn-reanimated', '~4.3.0', { storeRoot });
      assert.equal(result?.version, '4.3.1');
    });
  });

  it('returns null when no installed version satisfies the range', () => {
    withTempStore((storeRoot) => {
      writeStoreEntry(storeRoot, 'rn@5.6.2_x', 'rn');
      assert.equal(resolvePackageFromPnpmStore('rn', '~5.7.0', { storeRoot }), null);
    });
  });

  it('skips entries whose inner node_modules/<pkg> is missing (half-installed)', () => {
    withTempStore((storeRoot) => {
      // Higher version is half-installed (no package.json).
      fs.mkdirSync(path.join(storeRoot, 'rn@5.7.0_x', 'node_modules', 'rn'), { recursive: true });
      writeStoreEntry(storeRoot, 'rn@5.6.5_x', 'rn');
      const result = resolvePackageFromPnpmStore('rn', '^5.6.0', { storeRoot });
      assert.equal(result?.version, '5.6.5');
    });
  });

  it('skips entries whose version segment is not valid semver', () => {
    withTempStore((storeRoot) => {
      fs.mkdirSync(path.join(storeRoot, 'rn-svg@not-a-version_foo'), { recursive: true });
      writeStoreEntry(storeRoot, 'rn-svg@15.15.4_x', 'rn-svg');
      const result = resolvePackageFromPnpmStore('rn-svg', '15.15.4', { storeRoot });
      assert.equal(result?.version, '15.15.4');
    });
  });

  it('returns null without throwing when the store root does not exist', () => {
    const missing = path.join(os.tmpdir(), `pnpm-missing-${Date.now()}`);
    assert.equal(resolvePackageFromPnpmStore('x', '1.0.0', { storeRoot: missing }), null);
  });
});
