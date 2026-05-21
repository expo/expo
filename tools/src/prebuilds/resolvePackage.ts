import fs from 'fs';
import { globSync } from 'glob';
import path from 'path';
import semver from 'semver';

import { getExpoRepositoryRootDir } from '../Directories';

const WORKSPACE_GLOBS = ['apps/*', 'packages/*', 'packages/@expo/*', 'tools'];

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
 * Returns the highest version of `packageName` installed in any monorepo
 * workspace satisfying `range`, or `null`. Goes through Node's `require.resolve`
 * — no assumptions about pnpm store / lockfile shape.
 */
export function resolveInstalledPackage(
  packageName: string,
  range: string,
  opts: { repoRoot?: string; workspacePatterns?: string[] } = {}
): { path: string; version: string } | null {
  const repoRoot = opts.repoRoot ?? getExpoRepositoryRootDir();
  const patterns = opts.workspacePatterns ?? WORKSPACE_GLOBS;
  let best: { path: string; version: string } | null = null;
  for (const pattern of patterns) {
    for (const ws of globSync(pattern, { cwd: repoRoot, absolute: true })) {
      let pkgJson: string;
      try {
        pkgJson = require.resolve(`${packageName}/package.json`, { paths: [ws] });
      } catch {
        continue;
      }
      let version: string | undefined;
      try {
        version = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).version;
      } catch {
        /* skip */
      }
      if (!version || !semver.valid(version) || !semver.satisfies(version, range)) continue;
      if (!best || semver.gt(version, best.version)) best = { path: path.dirname(pkgJson), version };
    }
  }
  return best;
}
