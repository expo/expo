/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { CacheData, FallbackFilesystem, FileData, FileMetadata, FileStats, FileSystemListener, LookupResult, MutableFileSystem, Path, ProcessFileFunction } from '../types';
type DirectoryNode = Map<string, MixedNode | null>;
type FileNode = FileMetadata;
type MixedNode = FileNode | DirectoryNode;
interface DeserializedSnapshotInput {
    rootDir: string;
    fileSystemData: DirectoryNode;
    processFile: ProcessFileFunction;
    fallbackFilesystem?: FallbackFilesystem | null | undefined;
    roots?: readonly string[];
    serverRoot?: string | null | undefined;
}
interface TreeFSOptions {
    rootDir: Path;
    files?: FileData;
    processFile: ProcessFileFunction;
    fallbackFilesystem?: FallbackFilesystem | null | undefined;
    roots?: readonly string[];
    serverRoot?: string | null | undefined;
}
interface MatchFilesOptions {
    readonly filter?: RegExp | null;
    readonly filterCompareAbsolute?: boolean;
    readonly filterComparePosix?: boolean;
    readonly follow?: boolean;
    readonly recursive?: boolean;
    readonly rootDir?: Path | null;
}
interface MetadataIteratorOptions {
    readonly includeSymlinks: boolean;
    readonly includeNodeModules: boolean;
}
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
 * Symlinks are represented as nodes whose metadata contains their literal
 * target. Literal targets are resolved to normal paths at runtime, and cached.
 * If a symlink is encountered during traversal, we restart traversal at the
 * root node targeting join(normal symlink target, remaining path suffix).
 *
 * NODE TYPES:
 *
 * - A directory (including a parent directory at '..') is represented by a
 *   `Map` of basenames to any other node type.
 * - A file is represented by an `Array`  (tuple) of metadata, of which:
 *   - A regular file has node[H.SYMLINK] === 0
 *   - A symlink has node[H.SYMLINK] === 1 or
 *     typeof node[H.SYMLINK] === 'string', where a string is the literal
 *     content of the symlink (i.e. from readlink), if known.
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
    #private;
    constructor(opts: TreeFSOptions);
    getSerializableSnapshot(): CacheData['fileSystemData'];
    static fromDeserializedSnapshot(args: DeserializedSnapshotInput): TreeFS;
    getSize(mixedPath: Path): number | null;
    getDifference(files: FileData, options?: {
        /**
         * Only consider files under this normal subdirectory when computing
         * removedFiles. If not provided, all files in the file system are
         * considered.
         */
        readonly subpath?: string;
    }): {
        changedFiles: FileData;
        removedFiles: Set<string>;
    };
    getMtimeByNormalPath(normalPath: Path): number | null;
    getSha1(mixedPath: Path): string | null;
    getOrComputeSha1(mixedPath: Path): Promise<{
        sha1: string;
        content?: Buffer;
    } | null | undefined>;
    exists(mixedPath: Path): boolean;
    lookup(mixedPath: Path): LookupResult;
    getAllFiles(): Path[];
    linkStats(mixedPath: Path): FileStats | null;
    /**
     * Given a search context, return a list of file paths matching the query.
     * The query matches against normalized paths which start with `./`,
     * for example: `a/b.js` -> `./a/b.js`
     */
    matchFiles(opts: MatchFilesOptions): Generator<Path>;
    addOrModify(mixedPath: Path, metadata: FileMetadata, changeListener?: FileSystemListener): void;
    bulkAddOrModify(addedOrModifiedFiles: FileData, changeListener?: FileSystemListener): void;
    remove(mixedPath: Path, changeListener?: FileSystemListener): void;
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
     * If opts.invalidatedBy is given, collects all absolute, real paths that if
     * added or removed may invalidate this result.
     *
     * Useful for finding the closest package scope (subpath: package.json,
     * type f, breakOnSegment: node_modules) or closest potential package root
     * (subpath: node_modules/pkg, type: d) in Node.js resolution.
     */
    hierarchicalLookup(mixedStartPath: string, subpath: string, opts: {
        breakOnSegment: string | null | undefined;
        invalidatedBy: Set<string> | null | undefined;
        subpathType: 'f' | 'd';
    }): {
        absolutePath: string;
        containerRelativePath: string;
    } | null | undefined;
    metadataIterator(opts: MetadataIteratorOptions): Generator<{
        baseName: string;
        canonicalPath: string;
        metadata: FileMetadata;
    }>;
}
export {};
