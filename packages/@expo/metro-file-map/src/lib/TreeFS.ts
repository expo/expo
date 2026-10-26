/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'invariant';
import path from 'path';

import H from '../constants';
import type {
  CacheData,
  FileData,
  FileMetadata,
  FileStats,
  FileSystemListener,
  LookupResult,
  MutableFileSystem,
  Observations,
  Path,
  ProcessFileFunction,
} from '../types';
import { RootPathUtils } from './RootPathUtils';
import normalizePathSeparatorsToSystem from './normalizePathSeparatorsToSystem';

type DirectoryNode = Map<string, MixedNode>;
type FileNode = FileMetadata;
type MixedNode = FileNode | DirectoryNode;

function isDirectory(node: MixedNode | null | undefined): node is DirectoryNode {
  return node != null && !Array.isArray(node);
}

function isRegularFile(node: FileNode): boolean {
  return node[H.SYMLINK] === 0;
}

// Null if not within the ancestor ('' is the root).
function relativeToAncestor(
  normalPath: string,
  ancestorNormalPath: string
): string | null | undefined {
  if (ancestorNormalPath === '' || normalPath === ancestorNormalPath) {
    return ancestorNormalPath === '' ? normalPath : '';
  }
  return normalPath.startsWith(ancestorNormalPath + path.sep)
    ? normalPath.slice(ancestorNormalPath.length + 1)
    : null;
}

type DeserializedSnapshotInput = {
  rootDir: string;
  fileSystemData: DirectoryNode;
  processFile: ProcessFileFunction;
};

type TreeFSOptions = {
  rootDir: Path;
  files?: FileData;
  processFile: ProcessFileFunction;
};

type MatchFilesOptions = Readonly<{
  /* Filter relative paths against a pattern. */
  filter?: RegExp | null | undefined;
  /* `filter` is applied against absolute paths, vs rootDir-relative. (default: false) */
  filterCompareAbsolute?: boolean;
  /* `filter` is applied against posix-delimited paths, even on Windows. (default: false) */
  filterComparePosix?: boolean;
  /* Follow symlinks when enumerating paths. (default: false) */
  follow?: boolean;
  /* Should search for files recursively. (default: true) */
  recursive?: boolean;
  /* Match files under a given root, or null for all files */
  rootDir?: Path | null | undefined;
}>;

type MetadataIteratorOptions = Readonly<{
  includeSymlinks: boolean;
  includeNodeModules: boolean;
}>;

type AncestorEntry = {
  ancestorOfRootIdx: number | null | undefined;
  node: DirectoryNode;
  normalPath: string;
  segmentName: string;
};

type LookupByNormalPathOptions = {
  collectAncestors?: AncestorEntry[];
  // Record into which the canonical paths of traversed symlinks will be
  // added, as `content`. Omit for performance if not needed.
  observations?: Observations | null | undefined;

  // Low-level callbacks called on mutations of TreeFS data.
  // Omit for performance if not needed.
  changeListener?: FileSystemListener;

  // Like lstat vs stat, whether to follow a symlink at the basename of
  // the given path, or return the details of the symlink itself.
  followLeaf?: boolean;
  // Whether to (recursively) create missing directory nodes during
  // traversal, useful when adding files. Will throw if an expected
  // directory is already present as a file.
  makeDirectories?: boolean;
  // Resume traversal from a known directory node, whose normal path is
  // the prefix of the requested path ending at pathIdx - 1.
  start?: {
    ancestorOfRootIdx: number | null | undefined;
    node: DirectoryNode;
    pathIdx: number;
  } | null;
};

type LookupByNormalPathResult =
  | {
      ancestorOfRootIdx: number | null | undefined;
      canonicalPath: string;
      exists: true;
      node: MixedNode;
      parentNode: DirectoryNode;
    }
  | {
      ancestorOfRootIdx: number | null | undefined;
      canonicalPath: string;
      exists: true;
      node: DirectoryNode;
      parentNode: null;
    }
  | {
      canonicalMissingPath: string;
      missingSegmentName: string;
      // The normal path following the missing segment, or '' if none.
      remainingPath: string;
      exists: false;
    };

/**
 * OVERVIEW:
 *
 * TreeFS is Metro's in-memory representation of the file system. It is
 * structured as a tree of non-empty maps and leaves (tuples), with the root
 * node representing the given `rootDir`, typically Metro's _project root_
 * (not a filesystem root). Map keys are path segments, and branches outside
 * the project root are accessed via `'..'`.
 *
 * EXAMPLE:
 *
 * For a root dir '/data/project', the file '/data/other/app/index.js' would
 * have metadata at #rootNode.get('..').get('other').get('app').get('index.js')
 *
 * SERIALISATION:
 *
 * #rootNode is designed to be directly serialisable and directly portable (for
 * a given project) between different root directories and operating systems.
 *
 * SYMLINKS:
 *
 * Symlinks are represented as nodes whose metadata contains their target,
 * lexically resolved to a normal path with POSIX separators when the node was
 * populated. Lexical resolution only interprets the literal target relative to
 * the symlink's directory: it does not follow symlinks in the target, and the
 * target need not exist, so it is a normalPath, not a canonicalPath (see
 * TERMINOLOGY). The target is the only path stored inside the tree, so it must
 * not use system separators, or the snapshot would not be portable between
 * operating systems. If a symlink is encountered during traversal, we restart
 * traversal at the root node targeting join(normal symlink target, remaining
 * path suffix).
 *
 * NODE TYPES:
 *
 * - A directory (including a parent directory at '..') is represented by a
 *   `Map` of basenames to any other node type.
 * - A file is represented by an `Array`  (tuple) of metadata, of which:
 *   - A regular file has node[H.SYMLINK] === 0
 *   - A symlink has node[H.SYMLINK] === 1 or
 *     typeof node[H.SYMLINK] === 'string', where a string is the target
 *     lexically resolved to a normal path with POSIX separators, if known.
 *
 * TERMINOLOGY:
 *
 * - mixedPath
 *   A root-relative or absolute path
 * - relativePath
 *   A root-relative path
 * - normalPath
 *   A root-relative, normalised path (no extraneous '.' or '..'), may have a
 *   single trailing slash
 * - canonicalPath
 *   A root-relative, normalised, real path (no symlinks in dirname), never has
 *   a trailing slash
 */
export default class TreeFS implements MutableFileSystem {
  readonly #pathUtils: RootPathUtils;
  readonly #processFile: ProcessFileFunction;
  readonly #rootDir: Path;
  #rootNode: DirectoryNode = new Map();

  constructor(opts: TreeFSOptions) {
    const { rootDir, files, processFile } = opts;
    this.#rootDir = rootDir;
    this.#pathUtils = new RootPathUtils(rootDir);
    this.#processFile = processFile;
    if (files != null) {
      this.bulkAddOrModify(files);
    }
  }

  getSerializableSnapshot(): CacheData['fileSystemData'] {
    return this.#cloneTree(this.#rootNode);
  }

  static fromDeserializedSnapshot(args: DeserializedSnapshotInput): TreeFS {
    const { rootDir, fileSystemData, processFile } = args;
    const tfs = new TreeFS({ processFile, rootDir });
    tfs.#rootNode = fileSystemData;
    return tfs;
  }

  /**
   * Canonical paths of all files and symlinks outside every given directory.
   * Does not visit the contents of any directory within one.
   */
  *pathsOutsideRoots(mixedRoots: readonly Path[]): Iterable<string> {
    const rootPrefixes = mixedRoots.map((root) =>
      this.#absoluteDirPrefix(this.#normalizePath(root))
    );
    yield* this.#pathsOutsideRoots(this.#rootNode, '', rootPrefixes);
  }

  /**
   * The absolute path of `mixedPath` with each symlink it passes through in
   * this file system resolved, whether or not the path itself exists here.
   * Segments beyond the first missing one are kept as given.
   */
  resolveSymlinks(mixedPath: Path): Path {
    const result = this.#lookupByNormalPath(this.#normalizePath(mixedPath), {
      followLeaf: true,
    });
    if (result.exists) {
      return this.#pathUtils.normalToAbsolute(result.canonicalPath);
    }
    const { canonicalMissingPath, remainingPath } = result;
    return this.#pathUtils.normalToAbsolute(
      remainingPath === '' ? canonicalMissingPath : canonicalMissingPath + path.sep + remainingPath
    );
  }

  *#pathsOutsideRoots(
    node: DirectoryNode,
    prefix: string,
    rootPrefixes: readonly string[]
  ): Iterable<string> {
    for (const [name, child] of node) {
      const childPath = prefix === '' ? name : prefix + path.sep + name;
      if (name === '..' && isDirectory(child)) {
        // Past the top of a Windows drive, '..' holds the other drives, which
        // a root containing its own path does not contain.
        yield* this.#pathsOutsideRoots(child, childPath, rootPrefixes);
        continue;
      }
      const childPrefix = this.#absoluteDirPrefix(childPath);
      if (rootPrefixes.some((root) => childPrefix.startsWith(root))) {
        continue;
      }
      if (!isDirectory(child)) {
        yield childPath;
      } else if (rootPrefixes.some((root) => root.startsWith(childPrefix))) {
        yield* this.#pathsOutsideRoots(child, childPath, rootPrefixes);
      } else {
        for (const { canonicalPath } of this.#metadataIterator(
          child,
          { includeNodeModules: true, includeSymlinks: true },
          childPath
        )) {
          yield canonicalPath;
        }
      }
    }
  }

  // The absolute path of a normal path, with a trailing separator.
  #absoluteDirPrefix(normalPath: string): string {
    const absolutePath = this.#pathUtils.normalToAbsolute(normalPath);
    return absolutePath.endsWith(path.sep) ? absolutePath : absolutePath + path.sep;
  }

  getSize(mixedPath: Path): number | null | undefined {
    const fileMetadata = this.#getFileData(mixedPath);
    return (fileMetadata && fileMetadata[H.SIZE]) ?? null;
  }

  getDifference(
    files: FileData,
    options?: Readonly<{
      // Only consider files under this normal subdirectory when computing
      // removedFiles. If not provided, all files in the file system are
      // considered.
      subpath?: string;
    }>
  ): {
    changedFiles: FileData;
    removedFiles: Set<string>;
  } {
    const changedFiles: FileData = new Map(files);
    const removedFiles: Set<string> = new Set();
    const subpath = options?.subpath;

    // If a subpath is specified, start iteration from that node
    let rootNode: DirectoryNode = this.#rootNode;
    let prefix: string = '';
    if (subpath != null && subpath !== '') {
      const lookupResult = this.#lookupByNormalPath(subpath, {
        followLeaf: false,
      });
      if (!lookupResult.exists) {
        // Directory doesn't exist, nothing to compare - all files are new
        return { changedFiles, removedFiles };
      }
      if (!isDirectory(lookupResult.node)) {
        // A file or symlink has been replaced by this directory, so it is
        // removed and everything under the directory is new.
        removedFiles.add(lookupResult.canonicalPath);
        return { changedFiles, removedFiles };
      }
      rootNode = lookupResult.node;
      prefix = lookupResult.canonicalPath;
    }

    for (const { canonicalPath, metadata } of this.#metadataIterator(
      rootNode,
      {
        includeNodeModules: true,
        includeSymlinks: true,
      },
      prefix
    )) {
      const newMetadata = files.get(canonicalPath);
      if (newMetadata) {
        if (isRegularFile(newMetadata) !== isRegularFile(metadata)) {
          // Types differ, file has changed
          continue;
        }
        if (
          newMetadata[H.MTIME] != null &&
          // TODO: Remove when mtime is null if not populated
          newMetadata[H.MTIME] !== 0 &&
          newMetadata[H.MTIME] === metadata[H.MTIME]
        ) {
          // Types and modified time match - not changed.
          changedFiles.delete(canonicalPath);
        } else if (
          newMetadata[H.SHA1] != null &&
          newMetadata[H.SHA1] === metadata[H.SHA1] &&
          metadata[H.VISITED] === 1
        ) {
          // Content matches - update modified time but don't revisit
          const updatedMetadata: FileMetadata = [...metadata];
          updatedMetadata[H.MTIME] = newMetadata[H.MTIME];
          changedFiles.set(canonicalPath, updatedMetadata);
        }
      } else {
        removedFiles.add(canonicalPath);
      }
    }
    return {
      changedFiles,
      removedFiles,
    };
  }

  getSha1(mixedPath: Path): string | null | undefined {
    const fileMetadata = this.#getFileData(mixedPath);
    return (fileMetadata && fileMetadata[H.SHA1]) ?? null;
  }

  async getOrComputeSha1(
    mixedPath: Path
  ): Promise<{ sha1: string; content?: Buffer } | null | undefined> {
    const normalPath = this.#normalizePath(mixedPath);
    const result = this.#lookupByNormalPath(normalPath, {
      followLeaf: true,
    });
    if (!result.exists || isDirectory(result.node)) {
      return null;
    }
    const { canonicalPath, node: fileMetadata } = result;

    // Empty strings
    const existing = fileMetadata[H.SHA1];
    if (existing != null && existing.length > 0) {
      return { sha1: existing };
    }

    // Mutate the metadata we first retrieved. This may be orphaned or about
    // to be overwritten if the file changes while we are processing it -
    // by only mutating the original metadata, we don't risk caching a stale
    // SHA-1 after a change event.
    const maybeContent = await this.#processFile(canonicalPath, fileMetadata, {
      computeSha1: true,
    });
    const sha1 = fileMetadata[H.SHA1];
    invariant(
      sha1 != null && sha1.length > 0,
      "File processing didn't populate a SHA-1 hash for %s",
      canonicalPath
    );

    return maybeContent
      ? {
          content: maybeContent,
          sha1,
        }
      : { sha1 };
  }

  exists(mixedPath: Path): boolean {
    const result = this.#getFileData(mixedPath);
    return result != null;
  }

  lookup(mixedPath: Path, observations?: Observations | null | undefined): LookupResult {
    const normalPath = this.#normalizePath(mixedPath);
    const result = this.#lookupByNormalPath(normalPath, {
      observations,
      followLeaf: true,
    });
    if (!result.exists) {
      if (observations) {
        observations.existence.add(result.canonicalMissingPath);
      }
      return { exists: false };
    }
    const { canonicalPath, node } = result;
    if (observations) {
      observations.existence.add(canonicalPath);
    }
    const realPath = this.#pathUtils.normalToAbsolute(canonicalPath);
    if (isDirectory(node)) {
      return { exists: true, canonicalPath, realPath, type: 'd' };
    }
    invariant(
      isRegularFile(node),
      'lookup follows symlinks, so should never return one (%s -> %s)',
      mixedPath,
      canonicalPath
    );
    return { exists: true, canonicalPath, realPath, type: 'f', metadata: node };
  }

  getAllFiles(): Path[] {
    return Array.from(
      this.metadataIterator({
        includeNodeModules: true,
        includeSymlinks: false,
      }),
      ({ canonicalPath }) => this.#pathUtils.normalToAbsolute(canonicalPath)
    );
  }

  linkStats(mixedPath: Path): FileStats | null | undefined {
    const fileMetadata = this.#getFileData(mixedPath, { followLeaf: false });
    if (fileMetadata == null) {
      return null;
    }
    const fileType = isRegularFile(fileMetadata) ? 'f' : 'l';
    return {
      fileType,
      modifiedTime: fileMetadata[H.MTIME],
      size: fileMetadata[H.SIZE],
    };
  }

  /**
   * Given a search context, return a list of file paths matching the query.
   * The query matches against normalized paths which start with `./`,
   * for example: `a/b.js` -> `./a/b.js`
   */
  *matchFiles(opts: MatchFilesOptions): Iterable<Path> {
    const {
      filter = null,
      filterCompareAbsolute = false,
      filterComparePosix = false,
      follow = false,
      recursive = true,
      rootDir = null,
    } = opts;
    const normalRoot = rootDir == null ? '' : this.#normalizePath(rootDir);
    const contextRootResult = this.#lookupByNormalPath(normalRoot);
    if (!contextRootResult.exists) {
      return;
    }
    const {
      ancestorOfRootIdx,
      canonicalPath: rootRealPath,
      node: contextRoot,
      parentNode: contextRootParent,
    } = contextRootResult;
    if (!isDirectory(contextRoot)) {
      return;
    }
    const contextRootAbsolutePath =
      rootRealPath === '' ? this.#rootDir : path.join(this.#rootDir, rootRealPath);

    const prefix = filterComparePosix ? './' : '.' + path.sep;

    const contextRootAbsolutePathForComparison =
      filterComparePosix && path.sep !== '/'
        ? contextRootAbsolutePath.replaceAll(path.sep, '/')
        : contextRootAbsolutePath;

    for (const relativePathForComparison of this.#pathIterator(
      contextRoot,
      contextRootParent,
      ancestorOfRootIdx,
      {
        alwaysYieldPosix: filterComparePosix,
        canonicalPathOfRoot: rootRealPath,
        follow,
        recursive,
        subtreeOnly: rootDir != null,
      }
    )) {
      if (
        filter == null ||
        filter.test(
          // NOTE(EvanBacon): Ensure files start with `./` for matching purposes
          // this ensures packages work across Metro and Webpack (ex: Storybook for React DOM / React Native).
          // `a/b.js` -> `./a/b.js`
          filterCompareAbsolute === true
            ? path.join(contextRootAbsolutePathForComparison, relativePathForComparison)
            : prefix + relativePathForComparison
        )
      ) {
        const relativePath =
          filterComparePosix === true && path.sep !== '/'
            ? relativePathForComparison.replaceAll('/', path.sep)
            : relativePathForComparison;

        yield path.join(contextRootAbsolutePath, relativePath);
      }
    }
  }

  addOrModify(mixedPath: Path, metadata: FileMetadata, changeListener?: FileSystemListener): void {
    const normalPath = this.#normalizePath(mixedPath);
    // Walk the tree to find the *real* path of the parent node, creating
    // directories as we need.
    const parentDirNode = this.#lookupByNormalPath(path.dirname(normalPath), {
      changeListener,
      makeDirectories: true,
    });
    if (!parentDirNode.exists) {
      throw new Error(`TreeFS: Failed to make parent directory entry for ${mixedPath}`);
    }
    // Normalize the resulting path to account for the parent node being root.
    const canonicalPath = this.#normalizePath(
      parentDirNode.canonicalPath + path.sep + path.basename(normalPath)
    );
    this.bulkAddOrModify(new Map([[canonicalPath, metadata]]), changeListener);
  }

  bulkAddOrModify(addedOrModifiedFiles: FileData, changeListener?: FileSystemListener): void {
    // Optimisation: Bulk FileData are typically clustered by directory, so we
    // optimise for that case by remembering the last directory we looked up.
    // Experiments with large result sets show this to be significantly (~30%)
    // faster than caching all lookups in a Map, and 70% faster than no cache.
    let lastDir: string | null | undefined;
    let directoryNode: DirectoryNode | undefined;

    for (const [normalPath, metadata] of addedOrModifiedFiles) {
      const lastSepIdx = normalPath.lastIndexOf(path.sep);
      const dirname = lastSepIdx === -1 ? '' : normalPath.slice(0, lastSepIdx);
      const basename = lastSepIdx === -1 ? normalPath : normalPath.slice(lastSepIdx + 1);

      if (directoryNode == null || dirname !== lastDir) {
        const lookup = this.#lookupByNormalPath(dirname, {
          changeListener,
          followLeaf: false,
          makeDirectories: true,
        });
        if (!lookup.exists) {
          // This should only be possible if the input is non-real and
          // lookup hits a broken symlink.
          throw new Error(
            `TreeFS: Unexpected error adding ${normalPath}.\nMissing: ` +
              lookup.canonicalMissingPath
          );
        }
        if (!isDirectory(lookup.node)) {
          throw new Error(
            `TreeFS: Could not add directory ${dirname}, adding ${normalPath}. ` +
              `${dirname} already exists in the file map as a file.`
          );
        }
        lastDir = dirname;
        directoryNode = lookup.node;
      }
      if (changeListener != null) {
        const existingNode = directoryNode.get(basename);
        if (existingNode != null) {
          invariant(
            !isDirectory(existingNode),
            'Detected addition or modification of file %s, but it is tracked as a non-empty directory',
            normalPath
          );
          // File already exists - this is a modification
          changeListener.fileModified(normalPath, existingNode, metadata);
        } else {
          // New file
          changeListener.fileAdded(normalPath, metadata);
        }
      }
      directoryNode.set(basename, metadata);
    }
  }

  remove(mixedPath: Path, changeListener?: FileSystemListener): void {
    const normalPath = this.#normalizePath(mixedPath);
    this.#removeNormalPath(normalPath, changeListener);
  }

  #removeNormalPath(normalPath: string, changeListener?: FileSystemListener): void {
    const result = this.#lookupByNormalPath(normalPath, { followLeaf: false });
    if (!result.exists) {
      return;
    }
    const { parentNode, canonicalPath, node } = result;

    if (isDirectory(node) && node.size > 0) {
      for (const basename of node.keys()) {
        this.#removeNormalPath(canonicalPath + path.sep + basename, changeListener);
      }
      // Removing the last file will delete this directory
      return;
    }
    if (parentNode != null) {
      if (changeListener != null) {
        if (isDirectory(node)) {
          changeListener.directoryRemoved(canonicalPath);
        } else {
          changeListener.fileRemoved(canonicalPath, node);
        }
      }
      parentNode.delete(path.basename(canonicalPath));
      if (parentNode.size === 0 && parentNode !== this.#rootNode) {
        // NB: This isn't the most efficient algorithm - in the case of
        // removing the last file in a deep hierarchy it's O(depth^2), but
        // that's not expected to be a case common enough to justify
        // implementation complexity, or slowing down more common uses of
        // _lookupByNormalPath.
        this.#removeNormalPath(path.dirname(canonicalPath), changeListener);
      }
    }
  }

  /**
   * The core traversal algorithm of TreeFS - takes a normal path and traverses
   * through a tree of maps keyed on path segments, returning the node,
   * canonical path, and other metadata if successful, or the first missing
   * segment otherwise.
   *
   * When a symlink is encountered, we set a new target of the symlink's
   * normalised target path plus the remainder of the original target path. In
   * this way, the eventual target path in a successful lookup has all symlinks
   * resolved, and gives us the real path "for free". Similarly if a traversal
   * fails, we automatically have the real path of the first non-existent node.
   *
   * Note that this code is extremely hot during resolution, being the most
   * expensive part of a file existence check. Benchmark any modifications!
   */
  #lookupByNormalPath(
    requestedNormalPath: string,
    opts: LookupByNormalPathOptions = { followLeaf: true, makeDirectories: false }
  ): LookupByNormalPathResult {
    // We'll update the target if we hit a symlink.
    let targetNormalPath = requestedNormalPath;
    // Lazy-initialised set of seen target paths, to detect symlink cycles.
    let seen: Set<string> | null | undefined;
    // Pointer to the first character of the current path segment in
    // targetNormalPath.
    let fromIdx = opts.start?.pathIdx ?? 0;
    // The parent of the current segment.
    let parentNode = opts.start?.node ?? this.#rootNode;
    // If a returned node is (an ancestor of) the root, this is the number of
    // levels below the root, i.e. '' is 0, '..' is 1, '../..' is 2, otherwise
    // null.
    let ancestorOfRootIdx: number | null | undefined = opts.start?.ancestorOfRootIdx ?? 0;

    const { collectAncestors, changeListener } = opts;

    // Used only when collecting ancestors, to avoid double-counting nodes and
    // paths when traversing a symlink takes us back to rootNode and out again.
    // This tracks the first character of the first segment not already
    // collected.
    let unseenPathFromIdx = 0;

    while (targetNormalPath.length > fromIdx) {
      const nextSepIdx = targetNormalPath.indexOf(path.sep, fromIdx);
      const isLastSegment = nextSepIdx === -1;
      const segmentName = isLastSegment
        ? targetNormalPath.slice(fromIdx)
        : targetNormalPath.slice(fromIdx, nextSepIdx);
      const isUnseen = fromIdx >= unseenPathFromIdx;
      fromIdx = !isLastSegment ? nextSepIdx + 1 : targetNormalPath.length;

      if (segmentName === '.') {
        continue;
      }

      let segmentNode = parentNode.get(segmentName);

      // In normal paths all indirections are at the prefix, so we are at the
      // nth ancestor of the root iff the path so far is n '..' segments.
      if (segmentName === '..' && ancestorOfRootIdx != null) {
        ancestorOfRootIdx++;
      } else if (segmentNode != null) {
        ancestorOfRootIdx = null;
      }

      if (segmentNode == null) {
        if (opts.makeDirectories !== true && segmentName !== '..') {
          return {
            canonicalMissingPath: isLastSegment
              ? targetNormalPath
              : targetNormalPath.slice(0, fromIdx - 1),
            exists: false,
            missingSegmentName: segmentName,
            remainingPath: targetNormalPath.slice(fromIdx),
          };
        }
        segmentNode = new Map();
        if (opts.makeDirectories === true) {
          if (changeListener != null) {
            const canonicalPath = isLastSegment
              ? targetNormalPath
              : targetNormalPath.slice(0, fromIdx - 1);
            changeListener.directoryAdded(canonicalPath);
          }
          parentNode.set(segmentName, segmentNode);
        }
      }

      // We are done if...
      if (
        // ...at a directory node and the only subsequent character is `/`, or
        (nextSepIdx === targetNormalPath.length - 1 && isDirectory(segmentNode)) ||
        // there are no subsequent `/`, and this node is anything but a symlink
        // we're required to resolve due to followLeaf.
        (isLastSegment &&
          (isDirectory(segmentNode) || isRegularFile(segmentNode) || opts.followLeaf === false))
      ) {
        return {
          ancestorOfRootIdx,
          canonicalPath: isLastSegment ? targetNormalPath : targetNormalPath.slice(0, -1), // remove trailing `/`
          exists: true,
          node: segmentNode,
          parentNode,
        };
      }

      // If the next node is a directory, go into it
      if (isDirectory(segmentNode)) {
        parentNode = segmentNode;
        if (collectAncestors && isUnseen) {
          const currentPath = isLastSegment
            ? targetNormalPath
            : targetNormalPath.slice(0, fromIdx - 1);
          collectAncestors.push({
            ancestorOfRootIdx,
            node: segmentNode,
            normalPath: currentPath,
            segmentName,
          });
        }
      } else {
        const currentPath = isLastSegment
          ? targetNormalPath
          : targetNormalPath.slice(0, fromIdx - 1);

        if (isRegularFile(segmentNode)) {
          // Regular file in a directory path
          return {
            canonicalMissingPath: currentPath,
            exists: false,
            missingSegmentName: segmentName,
            remainingPath: targetNormalPath.slice(fromIdx),
          };
        }

        // Symlink in a directory path. Targets are stored already lexically
        // resolved to a normal path, with POSIX separators so that the
        // snapshot is portable between operating systems.
        const storedSymlinkTarget = segmentNode[H.SYMLINK];
        invariant(
          typeof storedSymlinkTarget === 'string',
          'Expected symlink target to be populated.'
        );
        const normalSymlinkTarget = normalizePathSeparatorsToSystem(storedSymlinkTarget);
        if (opts.observations) {
          opts.observations.content.add(currentPath);
        }

        const remainingTargetPath = isLastSegment ? '' : targetNormalPath.slice(fromIdx);

        // Append any subsequent path segments to the symlink target, and reset
        // with our new target.
        const joinedResult = this.#pathUtils.joinNormalToRelative(
          normalSymlinkTarget,
          remainingTargetPath
        );

        targetNormalPath = joinedResult.normalPath;

        // Two special cases (covered by unit tests):
        //
        // If the symlink target is the root, the root should be a counted as
        // an ancestor. We'd otherwise miss counting it because we normally
        // push new ancestors only when entering a directory.
        //
        // If the symlink target is an ancestor of the root *and* joining it
        // with the remaining path results in collapsing segments, e.g:
        // '../..' + 'parentofroot/root/foo.js' = 'foo.js', then we must add
        // parentofroot and root as ancestors.
        if (
          collectAncestors &&
          !isLastSegment &&
          // No-op optimisation to bail out the common case of nothing to do.
          (normalSymlinkTarget === '' || joinedResult.collapsedSegments > 0)
        ) {
          let node: MixedNode = this.#rootNode;
          let collapsedPath = '';
          const reverseAncestors: AncestorEntry[] = [];
          for (
            let i = 0;
            i <= joinedResult.collapsedSegments && /* always true: */ isDirectory(node);
            i++
          ) {
            reverseAncestors.push({
              ancestorOfRootIdx: i,
              node,
              normalPath: collapsedPath,
              segmentName: this.#pathUtils.getBasenameOfNthAncestor(i),
            });
            node = node.get('..') ?? new Map();
            collapsedPath = collapsedPath === '' ? '..' : collapsedPath + path.sep + '..';
          }
          collectAncestors.push(...reverseAncestors.reverse());
        }

        // For the purpose of collecting ancestors: Ignore the traversal to
        // the symlink target, and start collecting ancestors only
        // from the target itself (ie, the basename of the normal target path)
        // onwards.
        unseenPathFromIdx = normalSymlinkTarget.lastIndexOf(path.sep) + 1;

        if (seen == null) {
          // Optimisation: set this lazily only when we've encountered a symlink
          seen = new Set([requestedNormalPath]);
        }
        if (seen.has(targetNormalPath)) {
          // TODO: Warn `Symlink cycle detected: ${[...seen, node].join(' -> ')}`
          return {
            canonicalMissingPath: targetNormalPath,
            exists: false,
            missingSegmentName: segmentName,
            remainingPath: '',
          };
        }
        seen.add(targetNormalPath);
        fromIdx = 0;
        parentNode = this.#rootNode;
        ancestorOfRootIdx = 0;
      }
    }
    invariant(parentNode === this.#rootNode, 'Unexpectedly escaped traversal');
    return {
      ancestorOfRootIdx: 0,
      canonicalPath: targetNormalPath,
      exists: true,
      node: this.#rootNode,
      parentNode: null,
    };
  }

  /**
   * Given a start path (which need not exist), a subpath and type, and
   * optionally a 'breakOnSegment', performs the following:
   *
   * X = mixedStartPath
   * do
   *   if basename(X) === opts.breakOnSegment
   *     return null
   *   if X + subpath exists and has type opts.subpathType
   *     return {
   *       absolutePath: realpath(X + subpath)
   *       containerRelativePath: relative(mixedStartPath, X)
   *     }
   *   X = dirname(X)
   * while X !== dirname(X)
   *
   * Each candidate is checked from its own node: a subpath that is a single
   * path segment, such as `package.json`, with one map lookup, and a deeper
   * subpath by traversing only the subpath.
   *
   * If `observations` is given, records the canonical paths this result
   * depends upon.
   *
   * Useful for finding the closest package scope (subpath: package.json,
   * type f, breakOnSegment: node_modules) or closest potential package root
   * (subpath: node_modules/pkg, type: d) in Node.js resolution.
   */
  hierarchicalLookup(
    mixedStartPath: string,
    subpath: string,
    opts: {
      breakOnSegment: string | null | undefined;
      subpathType: 'f' | 'd';
    },
    observations?: Observations | null | undefined
  ):
    | {
        absolutePath: string;
        containerRelativePath: string;
      }
    | null
    | undefined {
    // Only a single path segment (e.g. `package.json`, but not
    // `node_modules/pkg`) can be looked up on a candidate's own node.
    const isBasename =
      subpath !== '' && subpath !== '.' && subpath !== '..' && !subpath.includes(path.sep);
    const ancestorsOfInput: AncestorEntry[] = [];
    const normalPath = this.#normalizePath(mixedStartPath);
    const closestLookup = this.#lookupByNormalPath(normalPath, {
      collectAncestors: ancestorsOfInput,
      observations,
    });

    if (closestLookup.exists && isDirectory(closestLookup.node)) {
      const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(
        closestLookup.canonicalPath,
        subpath,
        opts.subpathType,
        observations,
        {
          ancestorOfRootIdx: closestLookup.ancestorOfRootIdx,
          node: closestLookup.node,
        },
        isBasename
      );
      if (maybeAbsolutePathMatch != null) {
        return {
          absolutePath: maybeAbsolutePathMatch,
          containerRelativePath: '',
        };
      }
    } else {
      if (observations && (!closestLookup.exists || !isDirectory(closestLookup.node))) {
        observations.existence.add(
          closestLookup.exists ? closestLookup.canonicalPath : closestLookup.canonicalMissingPath
        );
      }
      if (
        opts.breakOnSegment != null &&
        !closestLookup.exists &&
        closestLookup.missingSegmentName === opts.breakOnSegment
      ) {
        return null;
      }
    }

    // Let the "common root" be the nearest common ancestor of this.rootDir
    // and the input path. We'll look for a match in two stages:
    // 1. Every collected ancestor of the input path, from nearest to furthest,
    //    that is a descendent of the common root
    // 2. The common root, and its ancestors.
    let commonRoot = this.#rootNode;
    let commonRootDepth = 0;

    // Collected ancestors do not include the lookup result itself, so go one
    // further if the input path is itself a root ancestor.
    if (closestLookup.exists && closestLookup.ancestorOfRootIdx != null) {
      commonRootDepth = closestLookup.ancestorOfRootIdx;
      invariant(isDirectory(closestLookup.node), 'ancestors of the root must be directories');
      commonRoot = closestLookup.node;
    } else {
      // Establish the common root by counting the '..' segments at the start
      // of the collected ancestors.
      for (const ancestor of ancestorsOfInput) {
        if (ancestor.ancestorOfRootIdx == null) {
          break;
        }
        commonRootDepth = ancestor.ancestorOfRootIdx;
        commonRoot = ancestor.node;
      }
    }

    // Phase 1: Consider descendenants of the common root, from deepest to
    // shallowest.
    for (
      let candidateIdx = ancestorsOfInput.length - 1;
      candidateIdx >= commonRootDepth;
      --candidateIdx
    ) {
      const candidate = ancestorsOfInput[candidateIdx]!;
      if (candidate.segmentName === opts.breakOnSegment) {
        return null;
      }
      const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(
        candidate.normalPath,
        subpath,
        opts.subpathType,
        observations,
        candidate,
        isBasename
      );
      if (maybeAbsolutePathMatch != null) {
        // Determine the input path relative to the current candidate. Note
        // that the candidate path will always be canonical (real), whereas the
        // input may contain symlinks, so the candidate is not necessarily a
        // prefix of the input. Use the fact that each remaining candidate
        // corresponds to a leading segment of the input normal path, and
        // discard the first candidateIdx + 1 segments of the input path.
        //
        // The next 5 lines are equivalent to (but faster than)
        // normalPath.split('/').slice(candidateIdx + 1).join('/').
        let prefixLength = commonRootDepth * 3; // Leading '../'
        for (let i = commonRootDepth; i <= candidateIdx; i++) {
          prefixLength = normalPath.indexOf(path.sep, prefixLength + 1);
        }
        const containerRelativePath = normalPath.slice(prefixLength + 1);
        return {
          absolutePath: maybeAbsolutePathMatch,
          containerRelativePath,
        };
      }
    }

    // Phase 2: Consider the common root and its ancestors

    // This will be '', '..', '../..', etc.
    let candidateNormalPath =
      commonRootDepth > 0 ? '..' + (path.sep + '..').repeat(commonRootDepth - 1) : '';
    // By its real path, if the start path reaches the common root through a
    // symlink.
    const remainingNormalPath =
      relativeToAncestor(normalPath, candidateNormalPath) ??
      relativeToAncestor(
        closestLookup.exists
          ? closestLookup.canonicalPath
          : closestLookup.remainingPath === ''
            ? closestLookup.canonicalMissingPath
            : closestLookup.canonicalMissingPath + path.sep + closestLookup.remainingPath,
        candidateNormalPath
      );
    if (remainingNormalPath == null) {
      return null;
    }

    let nextNode: MixedNode | null | undefined = commonRoot;
    let depthBelowCommonRoot = 0;

    while (isDirectory(nextNode)) {
      const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(
        candidateNormalPath,
        subpath,
        opts.subpathType,
        observations,
        {
          ancestorOfRootIdx: commonRootDepth + depthBelowCommonRoot,
          node: nextNode,
        },
        isBasename
      );
      if (maybeAbsolutePathMatch != null) {
        const rootDirParts = this.#pathUtils.getParts();
        const relativeParts =
          depthBelowCommonRoot > 0
            ? rootDirParts.slice(
                -(depthBelowCommonRoot + commonRootDepth),
                commonRootDepth > 0 ? -commonRootDepth : undefined
              )
            : [];
        if (remainingNormalPath !== '') {
          relativeParts.push(remainingNormalPath);
        }
        return {
          absolutePath: maybeAbsolutePathMatch,
          containerRelativePath: relativeParts.join(path.sep),
        };
      }
      depthBelowCommonRoot++;
      candidateNormalPath =
        candidateNormalPath === '' ? '..' : candidateNormalPath + path.sep + '..';
      nextNode = nextNode.get('..');
    }
    return null;
  }

  /**
   * Whether the real directory at `normalCandidatePath` has `subpath` of the
   * given type, returning the absolute real path of the match.
   *
   * `candidate` is the directory node at `normalCandidatePath`. When
   * `isBasename` and the candidate is the root or a descendant of it, the
   * child is checked with one map lookup. An ancestor of the root is
   * traversed instead, because its node does not hold the segment leading
   * back towards the root. Otherwise, traversal starts from the candidate.
   */
  #checkCandidateHasSubpath(
    normalCandidatePath: string,
    subpath: string,
    subpathType: 'f' | 'd',
    observations: Observations | null | undefined,
    candidate: {
      readonly ancestorOfRootIdx: number | null | undefined;
      readonly node: DirectoryNode;
    },
    isBasename: boolean
  ): string | null | undefined {
    if (isBasename && (candidate.ancestorOfRootIdx == null || candidate.ancestorOfRootIdx === 0)) {
      const childNode = candidate.node.get(subpath);
      // A symlink must be traversed to learn its type and real path, so only
      // a missing child, a directory or a regular file is answered here.
      if (childNode == null || isDirectory(childNode) || isRegularFile(childNode)) {
        const isMatch = childNode != null && isDirectory(childNode) === (subpathType === 'd');
        if (!isMatch && observations == null) {
          return null;
        }
        const childNormalPath =
          normalCandidatePath === '' ? subpath : normalCandidatePath + path.sep + subpath;
        if (observations) {
          observations.existence.add(childNormalPath);
        }
        return isMatch ? this.#pathUtils.normalToAbsolute(childNormalPath) : null;
      }
    }
    const { normalPath: normalSubpath, collapsedSegments } = this.#pathUtils.joinNormalToRelative(
      normalCandidatePath,
      subpath
    );
    const lookupResult = this.#lookupByNormalPath(normalSubpath, {
      observations,
      // Traverse only the subpath, starting from the candidate node. If the
      // join collapsed segments (e.g. '..' + 'root/package.json'), the
      // candidate path is no longer a prefix, so start from the root.
      start:
        collapsedSegments === 0
          ? {
              ancestorOfRootIdx: candidate.ancestorOfRootIdx,
              node: candidate.node,
              pathIdx: normalCandidatePath === '' ? 0 : normalCandidatePath.length + 1,
            }
          : null,
    });
    if (
      lookupResult.exists &&
      // Should be a Map iff subpathType is directory
      isDirectory(lookupResult.node) === (subpathType === 'd')
    ) {
      if (observations) {
        observations.existence.add(lookupResult.canonicalPath);
      }
      return this.#pathUtils.normalToAbsolute(lookupResult.canonicalPath);
    } else if (observations) {
      observations.existence.add(
        lookupResult.exists ? lookupResult.canonicalPath : lookupResult.canonicalMissingPath
      );
    }
    return null;
  }

  *metadataIterator(opts: MetadataIteratorOptions): IteratorObject<
    {
      baseName: string;
      canonicalPath: string;
      metadata: FileMetadata;
    },
    void
  > {
    yield* this.#metadataIterator(this.#rootNode, opts);
  }

  *#metadataIterator(
    rootNode: DirectoryNode,
    opts: Readonly<{ includeSymlinks: boolean; includeNodeModules: boolean }>,
    prefix: string = ''
  ): Iterable<{
    baseName: string;
    canonicalPath: string;
    metadata: FileMetadata;
  }> {
    for (const [name, node] of rootNode) {
      if (!opts.includeNodeModules && isDirectory(node) && name === 'node_modules') {
        continue;
      }
      const prefixedName = prefix === '' ? name : prefix + path.sep + name;
      if (isDirectory(node)) {
        yield* this.#metadataIterator(node, opts, prefixedName);
      } else if (isRegularFile(node) || opts.includeSymlinks) {
        yield { baseName: name, canonicalPath: prefixedName, metadata: node };
      }
    }
  }

  #normalizePath(relativeOrAbsolutePath: Path): string {
    return path.isAbsolute(relativeOrAbsolutePath)
      ? this.#pathUtils.absoluteToNormal(relativeOrAbsolutePath)
      : this.#pathUtils.relativeToNormal(relativeOrAbsolutePath);
  }

  *#directoryNodeIterator(
    node: DirectoryNode,
    parent: DirectoryNode | null | undefined,
    ancestorOfRootIdx: number | null | undefined
  ): IteratorObject<[string, MixedNode], void> {
    if (ancestorOfRootIdx != null && ancestorOfRootIdx > 0 && parent) {
      yield [this.#pathUtils.getBasenameOfNthAncestor(ancestorOfRootIdx - 1), parent] as [
        string,
        MixedNode,
      ];
    }
    yield* node.entries();
  }

  /**
   * Enumerate paths under a given node, including symlinks and through
   * symlinks (if `follow` is enabled).
   */
  *#pathIterator(
    iterationRootNode: DirectoryNode,
    iterationRootParentNode: DirectoryNode | null | undefined,
    ancestorOfRootIdx: number | null | undefined,
    opts: Readonly<{
      alwaysYieldPosix: boolean;
      canonicalPathOfRoot: string;
      follow: boolean;
      recursive: boolean;
      subtreeOnly: boolean;
    }>,
    pathPrefix: string = '',
    followedLinks: ReadonlySet<FileMetadata> = new Set()
  ): Iterable<Path> {
    const pathSep = opts.alwaysYieldPosix ? '/' : path.sep;
    const prefixWithSep = pathPrefix === '' ? pathPrefix : pathPrefix + pathSep;
    for (const [name, node] of this.#directoryNodeIterator(
      iterationRootNode,
      iterationRootParentNode,
      ancestorOfRootIdx
    )) {
      if (opts.subtreeOnly && name === '..') {
        continue;
      }

      const nodePath = prefixWithSep + name;
      if (!isDirectory(node)) {
        if (isRegularFile(node)) {
          // regular file
          yield nodePath;
        } else {
          // symlink
          const nodePathWithSystemSeparators =
            pathSep === path.sep ? nodePath : nodePath.replaceAll(pathSep, path.sep);

          // Although both paths are normal, the node path may begin '..' so we
          // can't simply concatenate.
          const normalPathOfSymlink = path.join(
            opts.canonicalPathOfRoot,
            nodePathWithSystemSeparators
          );

          // We can't resolve the symlink directly here because we only have
          // its normal path, and we need a canonical path for resolution
          // (imagine our normal path contains a symlink 'bar' -> '.', and we
          // are at /foo/bar/baz where baz -> '..' - that should resolve to
          // /foo, not /foo/bar). We *can* use _lookupByNormalPath to walk to
          // the canonical symlink, and then to its target.
          const resolved = this.#lookupByNormalPath(normalPathOfSymlink, {
            followLeaf: true,
          });
          if (!resolved.exists) {
            // Symlink goes nowhere, nothing to report.
            continue;
          }
          const target = resolved.node;
          if (!isDirectory(target)) {
            // Symlink points to a file, just yield the path of the symlink.
            yield nodePath;
          } else if (opts.recursive && opts.follow && !followedLinks.has(node)) {
            // Symlink points to a directory - iterate over its contents using
            // the path where we found the symlink as a prefix.
            yield* this.#pathIterator(
              target,
              resolved.parentNode,
              resolved.ancestorOfRootIdx,
              opts,
              nodePath,
              new Set([...followedLinks, node])
            );
          }
        }
      } else if (opts.recursive) {
        yield* this.#pathIterator(
          node,
          iterationRootParentNode,
          ancestorOfRootIdx != null && ancestorOfRootIdx > 0 ? ancestorOfRootIdx - 1 : null,
          opts,
          nodePath,
          followedLinks
        );
      }
    }
  }

  #getFileData(
    filePath: Path,
    opts: { followLeaf: boolean } = { followLeaf: true }
  ): FileMetadata | null | undefined {
    const normalPath = this.#normalizePath(filePath);
    const result = this.#lookupByNormalPath(normalPath, {
      followLeaf: opts.followLeaf,
    });
    if (!result.exists || isDirectory(result.node)) {
      return null;
    }
    return result.node;
  }

  #cloneTree(root: DirectoryNode): DirectoryNode {
    const clone: DirectoryNode = new Map();
    for (const [name, node] of root) {
      if (isDirectory(node)) {
        clone.set(name, this.#cloneTree(node));
      } else {
        clone.set(name, [...node]);
      }
    }
    return clone;
  }
}
