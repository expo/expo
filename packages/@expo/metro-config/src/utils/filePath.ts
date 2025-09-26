import path from 'node:path';

/** Convert any platform-specific path to a POSIX path.
 * @privateRemarks
 * Metro's equivalent is `normalizePathSeparatorsToPosix`
 */
export function toPosixPath(filePath: string): string {
  return path.sep === '\\' ? filePath.replaceAll('\\', '/') : filePath;
}
