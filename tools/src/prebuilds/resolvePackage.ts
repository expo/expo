import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import semver from 'semver';

import { getExpoRepositoryRootDir } from '../Directories';

// Mirrors the `packages:` globs in `pnpm-workspace.yaml`. Kept in sync by hand —
// if the workspace layout changes, update here. Parsing yaml just for this would
// add a dep this resolver doesn't otherwise need.
const WORKSPACE_GLOBS = [
  'apps/*',
  'packages/*',
  'packages/@expo/*',
  'tools',
  'apps/brownfield-tester/expo-app',
  'apps/bare-expo/e2e/image-comparison',
];

/**
 * Resolves the filesystem path to an npm package that isn't a direct dependency
 * of the tools package. Tries apps/bare-expo first (direct deps like react-native),
 * then react-native's own directory (transitive deps like @react-native/codegen).
 */
export function resolvePackagePath(packageName: string): string {
  const appDir = path.join(getExpoRepositoryRootDir(), 'apps', 'bare-expo');
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`, { paths: [appDir] }));
  } catch {
    // For transitive dependencies (e.g. @react-native/codegen), resolve from react-native's directory
    const rnDir = path.dirname(require.resolve('react-native/package.json', { paths: [appDir] }));
    return path.dirname(require.resolve(`${packageName}/package.json`, { paths: [rnDir] }));
  }
}

/**
 * Finds the highest installed version of `packageName` across all monorepo
 * workspaces that satisfies `range`. Used by the precompile to align built
 * XCFrameworks with `packages/expo/bundledNativeModules.json` rather than any
 * single workspace's pin (which drifts — see `apps/bare-expo`).
 *
 * Resolution goes through Node's own algorithm (`require.resolve`) from each
 * workspace dir, so the result is whatever the package manager symlinked or
 * hoisted there — no assumptions about pnpm's store dir-name shape, the
 * lockfile format, or peer/patch suffix encoding. Whatever resolves, resolves.
 *
 * Returns `null` if no workspace has a satisfying install.
 */
export async function resolveInstalledPackage(
  packageName: string,
  range: string,
  opts: { repoRoot?: string; workspacePatterns?: string[] } = {}
): Promise<{ path: string; version: string } | null> {
  const repoRoot = opts.repoRoot ?? getExpoRepositoryRootDir();
  const patterns = opts.workspacePatterns ?? WORKSPACE_GLOBS;

  const seen = new Set<string>();
  let best: { path: string; version: string } | null = null;

  for (const pattern of patterns) {
    const workspaces = await glob(pattern, { cwd: repoRoot, absolute: true });
    for (const workspaceDir of workspaces) {
      let resolvedPkgJson: string;
      try {
        resolvedPkgJson = require.resolve(`${packageName}/package.json`, {
          paths: [workspaceDir],
        });
      } catch {
        continue;
      }
      const pkgDir = path.dirname(resolvedPkgJson);
      if (seen.has(pkgDir)) continue;
      seen.add(pkgDir);

      let version: string;
      try {
        version = JSON.parse(fs.readFileSync(resolvedPkgJson, 'utf8')).version;
      } catch {
        continue;
      }
      if (!semver.valid(version) || !semver.satisfies(version, range)) continue;
      if (best && semver.lte(version, best.version)) continue;
      best = { path: pkgDir, version };
    }
  }
  return best;
}
