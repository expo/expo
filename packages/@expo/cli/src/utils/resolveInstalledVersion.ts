import fs from 'fs';
import resolveFrom from 'resolve-from';

/**
 * Resolve the installed version of a package by reading its `package.json`
 * from `node_modules` relative to `projectRoot`.
 *
 * Returns `null` if the package isn't installed, its `package.json` is hidden
 * by an `exports` map, or the file can't be parsed. This lets callers tell
 * "installed, version X" apart from "not resolvable" so they can skip comparisons
 * that would otherwise be made against a raw `package.json` spec string (which
 * may be `catalog:`, `workspace:*`, `npm:alias@...`, `file:`, etc.).
 */
export function resolveInstalledVersion(projectRoot: string, packageName: string): string | null {
  try {
    const pkgJsonPath = resolveFrom.silent(projectRoot, `${packageName}/package.json`);
    if (!pkgJsonPath) {
      return null;
    }
    const version = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}
