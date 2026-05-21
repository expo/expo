import fs from 'fs';
import path from 'path';
import semver from 'semver';

import { getExpoRepositoryRootDir } from '../Directories';

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
 * Returns the install of `packageName` in the pnpm content-addressable store at
 * the highest version satisfying `range`, decoupling the precompile from
 * `apps/bare-expo`'s drift-prone pin. `null` if nothing satisfies.
 */
export function resolvePackageFromPnpmStore(
  packageName: string,
  range: string,
  opts: { storeRoot?: string } = {}
): { path: string; version: string } | null {
  const storeRoot =
    opts.storeRoot ?? path.join(getExpoRepositoryRootDir(), 'node_modules', '.pnpm');
  // pnpm encodes scoped names by replacing `/` with `+`. Entry names look like
  // `<encoded>@<version>[_<peer-deps-or-patch-suffix>]`.
  const prefix = `${packageName.replace('/', '+')}@`;

  let entries: string[];
  try {
    entries = fs.readdirSync(storeRoot);
  } catch {
    return null;
  }

  let best: { path: string; version: string } | null = null;
  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue;
    const version = entry.slice(prefix.length).split('_')[0];
    if (!semver.valid(version) || !semver.satisfies(version, range)) continue;
    if (best && semver.lte(version, best.version)) continue;
    const sourcePath = path.join(storeRoot, entry, 'node_modules', packageName);
    if (!fs.existsSync(path.join(sourcePath, 'package.json'))) continue;
    best = { path: sourcePath, version };
  }
  return best;
}
