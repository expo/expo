import minimatch from 'minimatch';

/**
 * Indicate the given `filePath` should be excluded by `ignorePaths`
 */
export function isIgnoredPath(
  filePath: string,
  ignorePaths: string[],
  minimatchOptions: minimatch.IOptions = { dot: true }
): boolean {
  const minimatchObjs = ignorePaths.map(
    (ignorePath) => new minimatch.Minimatch(ignorePath, minimatchOptions)
  );

  let result = false;
  for (const minimatchObj of minimatchObjs) {
    const normalizedFilePath = normalizeFilePath(filePath);
    const currMatch = minimatchObj.match(normalizeFilePath(normalizedFilePath));
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
