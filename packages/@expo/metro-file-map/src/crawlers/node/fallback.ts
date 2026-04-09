import fs from 'fs';
import path from 'path';

import type { FallbackFilesystem, FileMetadata, IgnoreMatcher } from '../../types';
import { RootPathUtils } from '../../lib/RootPathUtils';

type DirectoryNode = Map<string, MixedNode | null>;
type FileNode = FileMetadata;
type MixedNode = FileNode | DirectoryNode;

type FallbackFilesystemOptions = {
  rootPathUtils: RootPathUtils;
  extensions: readonly string[];
  ignore: IgnoreMatcher;
  includeSymlinks: boolean;
};

const readdirMarker = Symbol.for('fallbackDir');

function markDir(dirNode: any) {
  dirNode[readdirMarker] = true;
}

function isMarkedDir(dirNode: any) {
  return !!dirNode[readdirMarker];
}

function isDirectory(node: MixedNode | null | undefined): node is DirectoryNode {
  return node instanceof Map;
}

/**
 * Create a FallbackFilesystem that synchronously queries the real filesystem.
 *
 * - `lookup` uses lstatSync to check a single path (for traversal).
 * - `readdir` uses readdirSync to list directory contents (for enumeration).
 *
 * Both methods apply the same filtering as the node crawler: ignore patterns,
 * extension filtering, and symlink inclusion.
 */
export default function createFallbackFilesystem(
  opts: FallbackFilesystemOptions
): FallbackFilesystem {
  const { rootPathUtils, extensions, ignore, includeSymlinks } = opts;

  function readdir(
    normalPath: string,
    absolutePath: string,
    dirNode: DirectoryNode | null | undefined
  ): DirectoryNode | null {
    if (dirNode != null && isMarkedDir(dirNode)) {
      return dirNode;
    }
    let dirEntries;
    try {
      dirEntries = fs.readdirSync(absolutePath, { withFileTypes: true });
    } catch {
      return null;
    }
    const result = dirNode ?? new Map();
    for (const entry of dirEntries) {
      const name = entry.name.toString();
      const childAbsolutePath = absolutePath + path.sep + name;

      if (ignore(childAbsolutePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (!result.has(name)) {
          result.set(name, new Map());
        }
      } else if (entry.isSymbolicLink()) {
        if (!includeSymlinks || result.has(name)) {
          continue;
        }
        try {
          const childNormalPath = normalPath === '' ? name : normalPath + path.sep + name;
          const symlinkTarget = fs.readlinkSync(childAbsolutePath);
          const target = rootPathUtils.resolveSymlinkToNormal(childNormalPath, symlinkTarget);
          result.set(name, [0, 0, 0, null, target, null]);
        } catch {
          // Can't read symlink target — skip
        }
      } else if (entry.isFile()) {
        const ext = path.extname(name).slice(1);
        if (!extensions.includes(ext) || result.has(name)) {
          continue;
        }
        result.set(name, [0, 0, 0, null, 0, null]);
      }
    }
    markDir(result);
    return result;
  }

  return {
    readdir,

    lookup(
      normalPath: string,
      absolutePath: string,
      prevNode: MixedNode | null | undefined
    ): MixedNode | null {
      if (ignore(absolutePath)) {
        return null;
      }

      let stat;
      try {
        stat = fs.lstatSync(absolutePath);
      } catch {
        return null;
      }

      if (stat.isDirectory()) {
        const dirNode = isDirectory(prevNode) ? prevNode : null;
        return shouldFallbackCrawlDir(absolutePath)
          ? readdir(normalPath, absolutePath, dirNode)
          : (dirNode ?? new Map());
      } else if (stat.isSymbolicLink()) {
        if (!includeSymlinks) {
          return null;
        }
        try {
          const symlinkTarget = fs.readlinkSync(absolutePath);
          const target = rootPathUtils.resolveSymlinkToNormal(normalPath, symlinkTarget);
          return [stat.mtime.getTime(), stat.size, 0, null, target, null];
        } catch {
          return null;
        }
      } else if (stat.isFile()) {
        // Check extension — symlinks bypass this check (same as node crawler)
        const ext = path.extname(absolutePath).slice(1);
        if (!extensions.includes(ext)) {
          return null;
        } else {
          return [stat.mtime.getTime(), stat.size, 0, null, 0, null];
        }
      } else {
        return null;
      }
    },
  };
}

// Whether a directory at the given canonical path should be eagerly
// populated via readdir. Returns false for directories that are typically
// too large (node_modules) or not useful (.git, .hg, etc.) to enumerate.
export function shouldFallbackCrawlDir(canonicalPath: string): boolean {
  const lastSepIdx = canonicalPath.lastIndexOf(path.sep);
  const baseStart = lastSepIdx + 1;
  const baseLen = canonicalPath.length - baseStart;
  if (
    baseLen === 2 &&
    canonicalPath.charCodeAt(baseStart) === 46 /*'.'*/ &&
    canonicalPath.charCodeAt(baseStart + 1) === 46 /*'.'*/
  ) {
    // '..' is the parent-of-rootDir indirection, not a hidden directory.
    return true;
  } else if (canonicalPath.charCodeAt(baseStart) === 46 /*'.'*/) {
    // starts with '.'
    return false;
  } else if (baseLen === 12 && canonicalPath.startsWith('node_modules', baseStart)) {
    return false;
  } else {
    return true;
  }
}
