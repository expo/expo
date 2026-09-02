import fs from 'fs';
import path from 'path';

export function fileExistsSync(file: string): boolean {
  return !!fs
    .statSync(file, {
      throwIfNoEntry: false,
    })
    ?.isFile();
}

export function directoryExistsSync(file: string): boolean {
  return !!fs
    .statSync(file, {
      throwIfNoEntry: false,
    })
    ?.isDirectory();
}

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isFile() ?? false;
}

export const ensureDirectoryAsync = (path: string) => fs.promises.mkdir(path, { recursive: true });

export const ensureDirectory = (path: string): void => {
  fs.mkdirSync(path, {
    recursive: true,
  });
};

export const copySync = (src: string, dest: string): void => {
  const destParent = path.dirname(dest);
  if (!fs.existsSync(destParent)) ensureDirectory(destParent);
  fs.cpSync(src, dest, {
    recursive: true,
    force: true,
  });
};

export const copyAsync = async (src: string, dest: string): Promise<void> => {
  const destParent = path.dirname(dest);
  if (!fs.existsSync(destParent)) {
    await fs.promises.mkdir(destParent, { recursive: true });
  }
  await fs.promises.cp(src, dest, {
    recursive: true,
    force: true,
  });
};

export const removeAsync = (path: string): Promise<void> => {
  return fs.promises.rm(path, {
    recursive: true,
    force: true,
  });
};

/**
 * The long path for a file or directory that exists.
 *
 * `fs.realpathSync` is Node's own walk and does not expand Windows 8.3 names (`RUNNER~1`).
 * `realpathSync.native` is the OS call that does. memfs has no native; it also answers with a
 * POSIX spelling on Windows, so `path.resolve` puts the result back on this platform's path.
 */
export function canonicalizeExistingPath(target: string): string {
  try {
    return realpathExistingSync(target);
  } catch {
    return path.resolve(target);
  }
}

export function maybeRealpathSync(target: string): string | null {
  try {
    return realpathExistingSync(target);
  } catch {
    return null;
  }
}

function realpathExistingSync(target: string): string {
  const native = fs.realpathSync.native;
  if (typeof native === 'function') {
    try {
      return normalizeCanonicalPath(path.resolve(native(target)));
    } catch {
      // memfs has no native implementation.
    }
  }
  return normalizeCanonicalPath(path.resolve(fs.realpathSync(target)));
}

/**
 * Strip Windows `\\?\` prefixes and trailing separators so two spellings of one directory
 * (8.3 vs long, file vs dir) hash to the same lock address.
 */
function normalizeCanonicalPath(value: string): string {
  let result = value;
  if (result.startsWith('\\\\?\\UNC\\')) {
    result = `\\\\${result.slice('\\\\?\\UNC\\'.length)}`;
  } else if (result.startsWith('\\\\?\\')) {
    result = result.slice('\\\\?\\'.length);
  }
  const { root } = path.parse(result);
  while (result.length > root.length && (result.endsWith('\\') || result.endsWith('/'))) {
    result = result.slice(0, -1);
  }
  return result;
}

export function isPathInside(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}
