import minimatch, { type IMinimatch } from 'minimatch';

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
