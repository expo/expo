/**
 * Hermetic tests for resolveInstalledPackage. Each test builds a fake monorepo
 * under a tmpdir with workspace dirs that each have their own
 * `node_modules/<pkg>/package.json`, then calls the resolver with the tmpdir as
 * repoRoot. Node's `require.resolve` does the rest.
 */
import fs from 'fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import { resolveInstalledPackage } from './resolvePackage';

function withTempRepo<T>(fn: (repoRoot: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function installInWorkspace(
  repoRoot: string,
  workspaceRelDir: string,
  packageName: string,
  version: string
) {
  const installDir = path.join(repoRoot, workspaceRelDir, 'node_modules', packageName);
  fs.mkdirSync(installDir, { recursive: true });
  fs.writeFileSync(
    path.join(installDir, 'package.json'),
    JSON.stringify({ name: packageName, version })
  );
  // require.resolve returns the realpath (macOS `/var` → `/private/var`).
  return fs.realpathSync(installDir);
}

const resolve = (repoRoot: string, name: string, range: string) =>
  resolveInstalledPackage(name, range, { repoRoot, workspacePatterns: ['apps/*'] });

describe('resolveInstalledPackage', () => {
  it('returns the install when exactly one workspace has a satisfying version', () => {
    withTempRepo((repoRoot) => {
      const installDir = installInWorkspace(repoRoot, 'apps/expo-go', 'rn-sample', '5.7.0');
      // A second workspace without the dep is skipped.
      fs.mkdirSync(path.join(repoRoot, 'apps/empty'), { recursive: true });
      assert.deepEqual(resolve(repoRoot, 'rn-sample', '~5.7.0'), {
        version: '5.7.0',
        path: installDir,
      });
    });
  });

  it('returns the highest version when multiple workspaces have different versions', () => {
    withTempRepo((repoRoot) => {
      installInWorkspace(repoRoot, 'apps/bare-expo', 'rn-sample', '5.6.2');
      installInWorkspace(repoRoot, 'apps/expo-go', 'rn-sample', '5.7.0');
      assert.equal(resolve(repoRoot, 'rn-sample', '^5.6.0')?.version, '5.7.0');
    });
  });

  it('resolves scoped packages', () => {
    withTempRepo((repoRoot) => {
      const installDir = installInWorkspace(
        repoRoot,
        'apps/expo-go',
        '@shopify/react-native-skia',
        '2.6.2'
      );
      assert.deepEqual(resolve(repoRoot, '@shopify/react-native-skia', '2.6.2'), {
        version: '2.6.2',
        path: installDir,
      });
    });
  });

  it('returns null when no workspace has a satisfying version', () => {
    withTempRepo((repoRoot) => {
      installInWorkspace(repoRoot, 'apps/bare-expo', 'rn-sample', '5.6.2');
      assert.equal(resolve(repoRoot, 'rn-sample', '~5.7.0'), null);
    });
  });

  it('ignores a workspace install with a non-semver version', () => {
    withTempRepo((repoRoot) => {
      installInWorkspace(repoRoot, 'apps/garbage', 'rn-sample', 'not-a-version');
      const installDir = installInWorkspace(repoRoot, 'apps/ok', 'rn-sample', '5.7.0');
      assert.deepEqual(resolve(repoRoot, 'rn-sample', '^5.0.0'), {
        version: '5.7.0',
        path: installDir,
      });
    });
  });

  it('returns null without throwing when the repo root does not exist', () => {
    const missing = path.join(os.tmpdir(), `mono-missing-${Date.now()}`);
    assert.equal(resolve(missing, 'rn-sample', '1.0.0'), null);
  });
});
