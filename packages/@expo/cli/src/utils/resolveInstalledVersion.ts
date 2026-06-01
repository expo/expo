import fs from 'fs';
import resolveFrom from 'resolve-from';

/**
 * Resolve the installed version of a package by reading its `package.json`
 * from `node_modules` relative to `projectRoot`.
 *
 * Returns `null` if the package isn't installed or the file can't be parsed.
 * This lets callers tell "installed, version X" apart from "not resolvable" so
 * they can skip comparisons that would otherwise be made against a raw
 * `package.json` spec string (which may be `catalog:`, `workspace:*`,
 * `npm:alias@...`, `file:`, etc.).
 *
 * Mirrors the `ERR_PACKAGE_PATH_NOT_EXPORTED` fallback in
 * `resolvePackageVersionAsync` so packages whose `exports` map omits
 * `./package.json` (common for newer libraries) still resolve correctly.
 */
export function resolveInstalledVersion(projectRoot: string, packageName: string): string | null {
  let pkgJsonPath: string | undefined;
  try {
    pkgJsonPath = resolveFrom(projectRoot, `${packageName}/package.json`);
  } catch (error: any) {
    // Packages with an `exports` map that doesn't expose `./package.json` throw
    // `ERR_PACKAGE_PATH_NOT_EXPORTED`. Node embeds the absolute on-disk path of
    // the package in the error message — extract it so we can still read the
    // installed version. Mirrors `resolvePackageVersionAsync`.
    if (error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      pkgJsonPath = error.message.match(/("exports"|defined) in (.*)$/i)?.[2];
    }
  }
  if (!pkgJsonPath) {
    return null;
  }
  try {
    const version = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}
