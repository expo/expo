import fs from 'fs/promises';
import { Minimatch, type MinimatchOptions } from 'minimatch';
import process from 'node:process';
import path from 'path';

/**
 * Indicate the given `filePath` should be excluded by the `ignorePaths`.
 */
export function isIgnoredPath(
  filePath: string,
  ignorePaths: string[],
  minimatchOptions: MinimatchOptions = { dot: true }
): boolean {
  const matchObjects = buildPathMatchObjects(ignorePaths, minimatchOptions);
  return isIgnoredPathWithMatchObjects(filePath, matchObjects);
}

/**
 * Prebuild match objects for `isIgnoredPathWithMatchObjects` calls.
 */
export function buildPathMatchObjects(
  paths: string[],
  minimatchOptions: MinimatchOptions = { dot: true }
): Minimatch[] {
  return paths.map((filePath) => new Minimatch(filePath, minimatchOptions));
}

/**
 * Append a new ignore path to the given `matchObjects`.
 */
export function appendIgnorePath(
  matchObjects: Minimatch[],
  path: string,
  minimatchOptions: MinimatchOptions = { dot: true }
) {
  matchObjects.push(new Minimatch(path, minimatchOptions));
}

/**
 * Build an ignore match objects for directories based on the given `ignorePathMatchObjects`.
 */
export function buildDirMatchObjects(
  ignorePathMatchObjects: Minimatch[],
  minimatchOptions: MinimatchOptions = { dot: true }
): Minimatch[] {
  const dirIgnorePatterns: string[] = [];
  const ignorePaths = ignorePathMatchObjects.filter((obj) => !obj.negate).map((obj) => obj.pattern);
  const negatedIgnorePaths = ignorePathMatchObjects
    .filter((obj) => obj.negate)
    .map((obj) => obj.pattern);

  // [0] Add positive patterns to dirIgnorePatterns
  for (const pattern of ignorePaths) {
    if (pattern.endsWith('/**/*')) {
      // `/**/*` matches
      dirIgnorePatterns.push(pattern.slice(0, -5));
    } else if (pattern.endsWith('/**')) {
      // `/**` by default matches directories
      dirIgnorePatterns.push(pattern.slice(0, -3));
    } else if (pattern.endsWith('/')) {
      // `/` suffix matches directories
      dirIgnorePatterns.push(pattern.slice(0, -1));
    }
  }

  // [1] If there is a negate pattern in the same directory, we should remove the existing directory.
  for (const pattern of negatedIgnorePaths) {
    for (let i = 0; i < dirIgnorePatterns.length; ++i) {
      const existingPattern = dirIgnorePatterns[i];
      if (isSubDirectory(existingPattern, pattern)) {
        dirIgnorePatterns.splice(i, 1);
      }
    }
  }

  return dirIgnorePatterns.map((pattern) => new Minimatch(pattern, minimatchOptions));
}

/**
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
export function isIgnoredPathWithMatchObjects(
  filePath: string,
  matchObjects: Minimatch[]
): boolean {
  let result = false;
  for (const minimatchObj of matchObjects) {
    const stripParentPrefix = minimatchObj.pattern.startsWith('**/');
    const normalizedFilePath = normalizeFilePath(filePath, { stripParentPrefix });
    const currMatch = minimatchObj.match(normalizedFilePath);
    if (minimatchObj.negate && result && !currMatch) {
      // Special handler for negate (!pattern).
      // As long as previous match result is true and not matched from the current negate pattern, we should early return.
      return false;
    }
    if (!minimatchObj.negate) {
      result ||= currMatch;
    }
  }
  return result;
}

/**
 * Returns true if `parent` is a parent directory of `child`.
 */
function isSubDirectory(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

const STRIP_PARENT_PREFIX_REGEX = /^(\.\.\/)+/g;

/**
 * Normalize the given `filePath` to be used for matching against `ignorePaths`.
 *
 * @param filePath The file path to normalize.
 * @param options.stripParentPrefix
 *   When people use fingerprint inside a monorepo, they may get source files from parent directories.
 *   However, minimatch '**' doesn't match the parent directories.
 *   We need to strip the `../` prefix to match the node_modules from parent directories.
 */
export function normalizeFilePath(filePath: string, options: { stripParentPrefix?: boolean }) {
  if (options.stripParentPrefix) {
    return filePath.replace(STRIP_PARENT_PREFIX_REGEX, '');
  }
  return filePath;
}

const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * Convert any platform-specific path to a POSIX path.
 */
export function toPosixPath(filePath: string): string {
  return process.platform === 'win32' ? filePath.replace(REGEXP_REPLACE_SLASHES, '/') : filePath;
}

/**
 * Check if the given `filePath` exists.
 */
export async function pathExistsAsync(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() || stat.isDirectory();
  } catch {
    return false;
  }
}
