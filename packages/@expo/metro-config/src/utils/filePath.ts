import { platform } from 'node:process';

const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * Convert any platform-specific path to a POSIX path.
 */
export function toPosixPath(filePath: string): string {
  return platform === 'win32' ? filePath.replace(REGEXP_REPLACE_SLASHES, '/') : filePath;
}

/**
 * Serialize any platform-specific path to embed within generated code.
 * This includes escaping possible backslashes on Windows, and adding quotes.
 */
export function serializePath(filePath: string): string {
  return filePath !== toPosixPath(filePath) ? JSON.stringify(filePath) : `'${filePath}'`;
}
