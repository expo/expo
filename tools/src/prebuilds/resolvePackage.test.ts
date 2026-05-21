/**
 * Tests for resolveInstalledPackage — uses a tmpdir-mocked monorepo layout
 * (workspace dirs with their own node_modules/<pkg>/package.json) so the suite
 * is hermetic and doesn't depend on what the live workspace happens to have
 * installed. Resolution goes through Node's `require.resolve`, so the test
 * just has to put a real `node_modules/<pkg>/package.json` in each fake
 * workspace and let Node's algorithm find it.
 */
import fs from 'fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import { resolveInstalledPackage } from './resolvePackage';

function withTempRepo<T>(fn: (repoRoot: string) => Promise<T> | T): Promise<T> | T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-'));
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
  try {
    const result = fn(dir);
    if (result instanceof Promise) {
      return result.finally(cleanup);
    }
    cleanup();
    return result;
  } catch (err) {
    cleanup();
    throw err;
  }
}

function writeWorkspaceWithDep(
  repoRoot: string,
  workspaceRelDir: string,
  packageName: string,
  version: string
) {
  const workspaceDir = path.join(repoRoot, workspaceRelDir);
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.writeFileSync(
    path.join(workspaceDir, 'package.json'),
    JSON.stringify({ name: path.basename(workspaceDir), dependencies: { [packageName]: version } })
  );
  const installDir = path.join(workspaceDir, 'node_modules', packageName);
  fs.mkdirSync(installDir, { recursive: true });
  fs.writeFileSync(
    path.join(installDir, 'package.json'),
    JSON.stringify({ name: packageName, version })
  );
  // Node's `require.resolve` returns the realpath (no `/private` prefix on macOS,
  // `/var` is a symlink to `/private/var`), so normalize here for comparisons.
  return fs.realpathSync(installDir);
}

describe('resolveInstalledPackage', () => {
  it('returns the install when exactly one workspace has a satisfying version', async () => {
    await withTempRepo(async (repoRoot) => {
      const installDir = writeWorkspaceWithDep(
        repoRoot,
        'apps/expo-go',
        'react-native-safe-area-context',
        '5.7.0'
      );
      const result = await resolveInstalledPackage('react-native-safe-area-context', '~5.7.0', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.deepEqual(result, { version: '5.7.0', path: installDir });
    });
  });

  it('returns the highest version when multiple workspaces have different versions', async () => {
    await withTempRepo(async (repoRoot) => {
      writeWorkspaceWithDep(repoRoot, 'apps/bare-expo', 'rn-sample', '5.6.2');
      writeWorkspaceWithDep(repoRoot, 'apps/expo-go', 'rn-sample', '5.7.0');
      const result = await resolveInstalledPackage('rn-sample', '^5.6.0', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.equal(result?.version, '5.7.0');
    });
  });

  it('resolves scoped packages', async () => {
    await withTempRepo(async (repoRoot) => {
      const installDir = writeWorkspaceWithDep(
        repoRoot,
        'apps/expo-go',
        '@shopify/react-native-skia',
        '2.6.2'
      );
      const result = await resolveInstalledPackage('@shopify/react-native-skia', '2.6.2', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.deepEqual(result, { version: '2.6.2', path: installDir });
    });
  });

  it('returns null when no workspace has a satisfying version', async () => {
    await withTempRepo(async (repoRoot) => {
      writeWorkspaceWithDep(repoRoot, 'apps/bare-expo', 'rn-sample', '5.6.2');
      const result = await resolveInstalledPackage('rn-sample', '~5.7.0', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.equal(result, null);
    });
  });

  it('deduplicates when multiple workspaces resolve to the same install path', async () => {
    await withTempRepo(async (repoRoot) => {
      // Two workspaces, but both happen to resolve to the same node_modules path
      // (simulating a hoisted/shared install). The de-dup should prevent double-counting.
      const sharedInstall = writeWorkspaceWithDep(
        repoRoot,
        'apps/shared-install',
        'rn-sample',
        '5.7.0'
      );
      // Workspace with no node_modules of its own — require.resolve walks up
      // and finds nothing, so it's just skipped.
      fs.mkdirSync(path.join(repoRoot, 'apps/empty'), { recursive: true });
      fs.writeFileSync(path.join(repoRoot, 'apps/empty/package.json'), '{}');
      const result = await resolveInstalledPackage('rn-sample', '~5.7.0', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.deepEqual(result, { version: '5.7.0', path: sharedInstall });
    });
  });

  it('skips workspaces that do not have the package installed', async () => {
    await withTempRepo(async (repoRoot) => {
      // expo-go has it, native-component-list does not.
      const installDir = writeWorkspaceWithDep(repoRoot, 'apps/expo-go', 'rn-sample', '5.7.0');
      fs.mkdirSync(path.join(repoRoot, 'apps/native-component-list'), { recursive: true });
      fs.writeFileSync(
        path.join(repoRoot, 'apps/native-component-list/package.json'),
        JSON.stringify({ name: 'native-component-list' })
      );
      const result = await resolveInstalledPackage('rn-sample', '~5.7.0', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.deepEqual(result, { version: '5.7.0', path: installDir });
    });
  });

  it('returns null without throwing when the repo root does not exist', async () => {
    const missing = path.join(os.tmpdir(), `mono-missing-${Date.now()}`);
    const result = await resolveInstalledPackage('rn-sample', '1.0.0', {
      repoRoot: missing,
      workspacePatterns: ['apps/*'],
    });
    assert.equal(result, null);
  });

  it('ignores a workspace install with a non-semver version', async () => {
    await withTempRepo(async (repoRoot) => {
      const garbage = path.join(repoRoot, 'apps/garbage/node_modules/rn-sample');
      fs.mkdirSync(garbage, { recursive: true });
      fs.writeFileSync(
        path.join(garbage, 'package.json'),
        JSON.stringify({ name: 'rn-sample', version: 'not-a-version' })
      );
      fs.writeFileSync(path.join(repoRoot, 'apps/garbage/package.json'), '{}');

      const installDir = writeWorkspaceWithDep(repoRoot, 'apps/ok', 'rn-sample', '5.7.0');
      const result = await resolveInstalledPackage('rn-sample', '^5.0.0', {
        repoRoot,
        workspacePatterns: ['apps/*'],
      });
      assert.deepEqual(result, { version: '5.7.0', path: installDir });
    });
  });
});
