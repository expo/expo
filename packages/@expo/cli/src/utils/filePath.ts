const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * Convert any platform-specific path to a POSIX path.
 */
export function toPosixPath(filePath: string): string {
  return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}
