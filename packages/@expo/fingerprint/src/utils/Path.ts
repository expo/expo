import minimatch, { type IMinimatch } from 'minimatch';
import path from 'path';

/**
 * Indicate the given `filePath` should be excluded by the `ignorePaths`.
 */
export function isIgnoredPath(
  filePath: string,
  ignorePaths: string[],
  minimatchOptions: minimatch.IOptions = { dot: true }
): boolean {
  const matchObjects = buildPathMatchObjects(ignorePaths, minimatchOptions);
  return isIgnoredPathWithMatchObjects(filePath, matchObjects);
}

/**
 * Prebuild match objects for `isIgnoredPathWithMatchObjects` calls.
 */
export function buildPathMatchObjects(
  paths: string[],
  minimatchOptions: minimatch.IOptions = { dot: true }
): IMinimatch[] {
  return paths.map((filePath) => new minimatch.Minimatch(filePath, minimatchOptions));
}

/**
 * Build an ignore match objects for directories based on the given `ignorePathMatchObjects`.
 */
export function buildDirMatchObjects(
  ignorePathMatchObjects: IMinimatch[],
  minimatchOptions: minimatch.IOptions = { dot: true }
): IMinimatch[] {
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

  return dirIgnorePatterns.map((pattern) => new minimatch.Minimatch(pattern, minimatchOptions));
}

/**
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
export function isIgnoredPathWithMatchObjects(
  filePath: string,
  matchObjects: IMinimatch[]
): boolean {
  let result = false;
  for (const minimatchObj of matchObjects) {
    const normalizedFilePath = normalizeFilePath(filePath);
    const currMatch = minimatchObj.match(normalizedFilePath);
    if (minimatchObj.negate && result && !currMatch) {
      // Special handler for negate (!pattern).
      // As long as previous match result is true and not matched from the current negate pattern, we should early return.
      return false;
    }
    result ||= currMatch;
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

const STRIP_NODE_MODULES_PREFIX_REGEX = /^(\.\.\/)+(node_modules\/)/g;

/**
 * Normalize the given `filePath` to be used for matching against `ignorePaths`.
 *
 * - When people use fingerprint inside a monorepo, they may get source files from parent directories.
 *   However, minimatch '**' doesn't match the parent directories.
 *   We need to strip the `../` prefix to match the node_modules from parent directories.
 */
function normalizeFilePath(filePath: string) {
  return filePath.replace(STRIP_NODE_MODULES_PREFIX_REGEX, '$2');
}
