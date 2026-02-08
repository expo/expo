import fs from 'fs';
import path from 'path';

import { memoize } from './memoize';

/** List filtered top-level files in `targetPath` (returns absolute paths) */
export async function listFilesSorted(
  targetPath: string,
  filter: (basename: string) => boolean
): Promise<string[]> {
  try {
    // `readdir` isn't guaranteed to be sorted on Windows
    return (await fs.promises.readdir(targetPath, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && filter(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => path.join(targetPath, entry.name));
  } catch {
    return [];
  }
}

/** List nested files in top-level directories in `targetPath` (returns relative paths) */
export async function listFilesInDirectories(
  targetPath: string,
  filter: (basename: string) => boolean
): Promise<string[]> {
  return (
    await Promise.all(
      (await fs.promises.readdir(targetPath, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async (directory) => {
          const entries = await fs.promises.readdir(path.join(targetPath, directory.name), {
            withFileTypes: true,
          });
          return entries
            .filter((entry) => entry.isFile() && filter(entry.name))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => path.join(directory.name, entry.name));
        })
    )
  ).flat(1);
}

/** Iterate folders recursively for files, optionally sorting results and filtering directories */
export async function* scanFilesRecursively(
  parentPath: string,
  includeDirectory?: (parentPath: string, name: string) => boolean,
  sort = !fs.opendir
) {
  const queue = [parentPath];
  let targetPath: string | undefined;
  while (queue.length > 0 && (targetPath = queue.shift()) != null) {
    try {
      const entries = sort
        ? (await fs.promises.readdir(targetPath, { withFileTypes: true })).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        : await fs.promises.opendir(targetPath);
      for await (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          if (!includeDirectory || includeDirectory(targetPath, entry.name)) {
            queue.push(path.join(targetPath, entry.name));
          }
        } else if (entry.isFile()) {
          yield {
            path: path.join(targetPath, entry.name),
            parentPath: targetPath,
            name: entry.name,
          } as const;
        }
      }
    } catch {
      continue;
    }
  }
}

export const fileExistsAsync = async (file: string): Promise<string | null> => {
  const stat = await fs.promises.stat(file).catch(() => null);
  return stat?.isFile() ? file : null;
};

export const fastJoin: (from: string, append: string) => string =
  path.sep === '/'
    ? (from, append) => `${from}${path.sep}${append}`
    : (from, append) =>
        `${from}${path.sep}${append[0] === '@' ? append.replace('/', path.sep) : append}`;

export const maybeRealpath = async (target: string): Promise<string | null> => {
  try {
    return await fs.promises.realpath(target);
  } catch {
    return null;
  }
};

export type PackageJson = Record<string, unknown> & { name?: string; version?: string };

export const loadPackageJson = memoize(async function loadPackageJson(
  jsonPath: string
): Promise<PackageJson | null> {
  try {
    const packageJsonText = await fs.promises.readFile(jsonPath, 'utf8');
    const json = JSON.parse(packageJsonText);
    if (typeof json !== 'object' || json == null) {
      return null;
    }
    return json;
  } catch {
    return null;
  }
});
