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
    const currMatch = minimatchObj.match(filePath);
    if (minimatchObj.negate && result && !currMatch) {
      // Special handler for negate (!pattern).
      // As long as previous match result is true and not matched from the current negate pattern, we should early return.
      return false;
    }
    result ||= currMatch;
  }
  return result;
}
