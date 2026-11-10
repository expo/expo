import fs from 'fs';
import path from 'path';

import H from '../constants';
import type { FallbackFilesystem, FileMetadata, IgnoreMatcher } from '../types';
import { RootPathUtils, getAncestorOfRootIdx, pathsToPattern } from './RootPathUtils';
import normalizePathSeparatorsToPosix from './normalizePathSeparatorsToPosix';

type DirectoryNode = Map<string, MixedNode | null>;
type FileNode = FileMetadata;
type MixedNode = FileNode | DirectoryNode;

type FallbackFilesystemOptions = {
  rootPathUtils: RootPathUtils;
  extensions: readonly string[];
  ignore: IgnoreMatcher;
  includeSymlinks: boolean;
};

const FALLBACK_DIR = Symbol.for('fallbackDir');

const enum FallbackFlag {
  VISITED = 0,
  CRAWLED = 1,
}

function markDir(dirNode: any, flag: FallbackFlag) {
  dirNode[FALLBACK_DIR] = flag;
}

function getDirFlag(dirNode: any): FallbackFlag | undefined {
  return dirNode[FALLBACK_DIR];
}

/**
 * Whether a directory node was created or populated by the fallback filesystem.
 * Used by TreeFS to determine if a directory outside the fallback boundary was
 * reached legitimately (e.g., via symlink traversal) and should allow further
 * fallback lookups.
 */
export function isFallbackDir(dirNode: any): boolean {
  return dirNode[FALLBACK_DIR] != null;
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

  const exts = extensions.reduce(
    (acc, ext) => {
      acc[ext] = true;
      return acc;
    },
    {} as Record<string, true | undefined>
  );

  function readdir(
    _normalPath: string,
    absolutePath: string,
    dirNode: DirectoryNode | null | undefined
  ): DirectoryNode | null {
    if (dirNode != null && getDirFlag(dirNode) === FallbackFlag.CRAWLED) {
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
        // NOTE(@kitten): ".git" and ".hg" check replace the VCS_DIRECTORIES ignore pattern
        // NOTE(@kitten): `.cxx` is ephemeral and should always be safe to ignore
        if (!result.has(name) && name !== '.git' && name !== '.hg' && name !== '.cxx') {
          const childDir = new Map();
          markDir(childDir, FallbackFlag.VISITED);
          result.set(name, childDir);
        }
      } else if (entry.isSymbolicLink()) {
        // We can skip reading the symlink target here, since it'll be read lazily
        if (includeSymlinks && !result.has(name)) {
          result.set(name, [null, 0, 0, null, 1, null]);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(name).slice(1);
        if (exts[ext] && !result.has(name)) {
          result.set(name, [null, 0, 0, null, 0, null]);
        }
      }
    }
    markDir(result, FallbackFlag.CRAWLED);
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
        if (shouldFallbackCrawlDir(absolutePath)) {
          return readdir(normalPath, absolutePath, dirNode);
        }
        if (dirNode != null) {
          return dirNode;
        }
        const newDir = new Map();
        markDir(newDir, FallbackFlag.VISITED);
        return newDir;
      } else if (stat.isSymbolicLink()) {
        if (!includeSymlinks) {
          return null;
        }
        try {
          // We might as well read the symlink target here and assume it'll be used
          const symlinkTarget = fs.readlinkSync(absolutePath);
          // Cached value should be in posix format
          const target = normalizePathSeparatorsToPosix(
            rootPathUtils.resolveSymlinkToNormal(normalPath, symlinkTarget)
          );
          return [stat.mtime.getTime(), stat.size, 0, null, target, null];
        } catch {
          return null;
        }
      } else if (stat.isFile()) {
        // Check extension — symlinks bypass this check (same as node crawler)
        const ext = path.extname(absolutePath).slice(1);
        if (!exts[ext]) {
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

type OnDemandFilesystemOptions = Readonly<{
  backend: FallbackFilesystem;
  pathUtils: RootPathUtils;
  // Absolute paths of the watched roots. These are crawled, so the fallback
  // never needs to look inside them.
  roots: readonly string[];
  // When set, the fallback only reaches this many levels above `rootDir`,
  // unless a symlink is followed.
  serverRoot: string | null | undefined;
}>;

/**
 * Fills TreeFS on demand from a FallbackFilesystem, for paths that the crawl
 * didn't reach: outside the watched roots, or under directories the crawl
 * skips. TreeFS calls into this where a lookup finds a missing segment, or an
 * iteration finds an empty directory.
 *
 * A `null` entry in a directory node records a path known to be missing, so
 * it isn't queried again.
 */
export class OnDemandFilesystem {
  readonly #backend: FallbackFilesystem;
  readonly #boundaryDepth: number | null;
  readonly #pathUtils: RootPathUtils;
  readonly #rootPattern: RegExp | null;

  constructor({ backend, pathUtils, roots, serverRoot }: OnDemandFilesystemOptions) {
    this.#backend = backend;
    this.#pathUtils = pathUtils;
    this.#boundaryDepth =
      serverRoot != null ? getAncestorOfRootIdx(pathUtils.absoluteToNormal(serverRoot)) : null;
    this.#rootPattern = pathsToPattern(roots, pathUtils);
  }

  /**
   * Look up the missing segment of a walk, which ends at `fromIdx` in
   * `targetNormalPath`. Returns the new node, or null if it doesn't exist on
   * disk. `wasFollowing` is set while resolving a symlink target, which may
   * escape the fallback boundary.
   */
  lookupMissingSegment(
    parentNode: DirectoryNode,
    segmentName: string,
    targetNormalPath: string,
    fromIdx: number,
    isLastSegment: boolean,
    wasFollowing: boolean
  ): MixedNode | null {
    const parentEnd = isLastSegment
      ? fromIdx - segmentName.length - 1
      : fromIdx - segmentName.length - 2;
    const parentCanonicalPath = parentEnd > 0 ? targetNormalPath.slice(0, parentEnd) : '';
    const childCanonicalPath =
      parentCanonicalPath === '' ? segmentName : parentCanonicalPath + path.sep + segmentName;
    if (
      this.#rootPattern?.test(childCanonicalPath + path.sep) ||
      (!wasFollowing && this.#isOutsideBoundary(childCanonicalPath, parentNode))
    ) {
      return null;
    } else if (parentCanonicalPath !== '' && shouldFallbackCrawlDir(parentCanonicalPath)) {
      // Populate the whole parent, on the assumption that its siblings will be
      // looked up next.
      this.#populateDir(parentNode, parentCanonicalPath, true, wasFollowing);
      return parentNode.get(segmentName) ?? null;
    } else if (parentNode.has(segmentName)) {
      return parentNode.get(segmentName) ?? null;
    } else {
      const parentAbsolute = this.#pathUtils.normalToAbsolute(parentCanonicalPath);
      const absolutePath = parentAbsolute + path.sep + segmentName;
      const node = this.#backend.lookup(
        childCanonicalPath,
        absolutePath,
        parentNode.get(segmentName)
      );
      parentNode.set(segmentName, node);
      return node;
    }
  }

  /**
   * Populate a directory that an iteration is about to enter, if it is empty.
   * `pathOfDir` is relative to `canonicalPathOfRoot`, using `pathSep`.
   * Parent directories ('..') are never populated.
   */
  populateIfEmpty(
    dirNode: DirectoryNode,
    canonicalPathOfRoot: string,
    pathOfDir: string,
    pathSep: string
  ): void {
    if (dirNode.size !== 0 || pathOfDir === '..' || pathOfDir.endsWith(pathSep + '..')) {
      return;
    }
    const pathWithSystemSeparators =
      pathSep === path.sep ? pathOfDir : pathOfDir.replaceAll(pathSep, path.sep);
    const canonicalPath =
      pathWithSystemSeparators === ''
        ? canonicalPathOfRoot
        : canonicalPathOfRoot === ''
          ? pathWithSystemSeparators
          : canonicalPathOfRoot + path.sep + pathWithSystemSeparators;
    this.#populateDir(dirNode, canonicalPath, false, false);
  }

  #isOutsideBoundary(canonicalPath: string, dirNode: DirectoryNode): boolean {
    // A directory the fallback created was reached legitimately.
    if (isFallbackDir(dirNode)) {
      return false;
    }
    const maxDepth = this.#boundaryDepth;
    return maxDepth != null && getAncestorOfRootIdx(canonicalPath) > maxDepth;
  }

  #populateDir(
    dirNode: DirectoryNode,
    canonicalPath: string,
    skipCheck: boolean,
    wasFollowed: boolean
  ): void {
    if (
      !skipCheck &&
      (this.#rootPattern?.test(canonicalPath + path.sep) ||
        (!wasFollowed && this.#isOutsideBoundary(canonicalPath, dirNode)))
    ) {
      return;
    }
    const absolutePath = this.#pathUtils.normalToAbsolute(canonicalPath);
    const entries = this.#backend.readdir(canonicalPath, absolutePath, dirNode);
    if (entries != null && entries !== dirNode) {
      for (const [name, entry] of entries) {
        if (!dirNode.has(name)) {
          dirNode.set(name, entry);
        }
      }
    }
  }
}

/**
 * Read the target of a symlink whose node was created without one
 * (`node[H.SYMLINK] === 1`), and store it in the node, lexically resolved to
 * a normal path with POSIX separators. Returns the target with system
 * separators, or undefined if it can't be read.
 */
export function readSymlinkTargetIntoNode(
  symlinkNode: FileMetadata,
  canonicalPathOfSymlink: string,
  pathUtils: RootPathUtils
): string | undefined {
  const absoluteSymlink = pathUtils.normalToAbsolute(canonicalPathOfSymlink);
  try {
    const literalSymlinkTarget = fs.readlinkSync(absoluteSymlink);
    const normalTarget = pathUtils.resolveSymlinkToNormal(
      canonicalPathOfSymlink,
      literalSymlinkTarget
    );
    symlinkNode[H.SYMLINK] = normalizePathSeparatorsToPosix(normalTarget);
    symlinkNode[H.VISITED] = 1;
    return normalTarget;
  } catch {
    return undefined;
  }
}

/**
 * Stat a file whose node was created without an mtime (`node[H.MTIME]` is
 * null or 0), and store its mtime and size. Its SHA-1 is cleared, since it
 * can't be trusted without an mtime.
 */
export async function statIntoNode(
  fileMetadata: FileMetadata,
  absolutePath: string
): Promise<void> {
  fileMetadata[H.SHA1] = null;
  try {
    const stat = await fs.promises.lstat(absolutePath);
    fileMetadata[H.MTIME] = stat.mtime.getTime();
    fileMetadata[H.SIZE] = stat.size;
  } catch {}
}

/**
 * Return a view of the tree that contains only the watched roots, so that
 * what the fallback added elsewhere isn't saved in the cache. Walks each root
 * path, creating intermediate directory nodes, and references the subtree at
 * each root directly. Roots don't overlap, so each contributes independently.
 *
 * Subtrees are shared with the live tree, not copied: the snapshot is
 * serialized right away by the cache manager.
 */
export function filterTreeToRoots(
  rootNode: DirectoryNode,
  normalRoots: readonly string[]
): DirectoryNode {
  if (normalRoots.length === 0) {
    return rootNode;
  }
  const clone: DirectoryNode = new Map();
  for (const normalRoot of normalRoots) {
    if (normalRoot === '') {
      // The root is rootDir itself: include everything except '..'
      for (const [name, node] of rootNode) {
        if (node != null && name !== '..') {
          clone.set(name, node);
        }
      }
    } else {
      copyRootInto(normalRoot, rootNode, clone);
    }
  }
  return clone;
}

function copyRootInto(normalRoot: string, source: DirectoryNode, clone: DirectoryNode): void {
  let currentSource = source;
  let currentClone = clone;
  let fromIdx = 0;

  while (fromIdx < normalRoot.length) {
    const nextSepIdx = normalRoot.indexOf(path.sep, fromIdx);
    const isLastSegment = nextSepIdx === -1;
    const seg = isLastSegment ? normalRoot.slice(fromIdx) : normalRoot.slice(fromIdx, nextSepIdx);
    fromIdx = isLastSegment ? normalRoot.length : nextSepIdx + 1;

    const sourceChild = currentSource.get(seg);
    if (sourceChild == null || !isDirectory(sourceChild)) {
      return;
    } else if (isLastSegment || fromIdx >= normalRoot.length) {
      currentClone.set(seg, sourceChild);
    } else {
      let cloneChild = currentClone.get(seg);
      if (cloneChild == null || !isDirectory(cloneChild)) {
        cloneChild = new Map();
        currentClone.set(seg, cloneChild);
      }
      currentSource = sourceChild;
      currentClone = cloneChild;
    }
  }
}
