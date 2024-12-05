import fs from 'fs';

const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * This is a workaround for Metro not resolving entry file paths to their real location.
 * When running exports through `eas build --local` on macOS, the `/var/folders` path is used instead of `/private/var/folders`.
 *
 * See: https://github.com/expo/expo/issues/28890
 */
export function resolveRealEntryFilePath(projectRoot: string, entryFile: string): string {
  if (projectRoot.startsWith('/private/var') && entryFile.startsWith('/var')) {
    return fs.realpathSync(entryFile);
  }

  return entryFile;
}

/**
 * Convert any platform-specific path to a POSIX path.
 */
export function toPosixPath(filePath: string): string {
  return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}
