/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PerfLogger, RootPerfLogger } from '@expo/metro/metro-config';

import type { HType, HTypeValue } from './constants';

export type { HType, HTypeValue };

export type { PerfLoggerFactory, PerfLogger } from '@expo/metro/metro-config';

// These inputs affect the internal data collected for a given filesystem
// state, and changes may invalidate a cache.
export interface BuildParameters {
  readonly computeSha1: boolean;
  readonly enableSymlinks: boolean;
  readonly extensions: readonly string[];
  /** @deprecated */
  readonly forceNodeFilesystemAPI?: boolean;
  readonly ignorePattern: RegExp | null;
  readonly plugins: readonly InputFileMapPlugin[];
  readonly retainAllFiles: boolean;
  readonly rootDir: string;
  readonly roots: readonly string[];
  readonly cacheBreaker: string;
}

export interface BuildResult {
  fileSystem: FileSystem;
}

export interface CacheData {
  readonly clocks: WatchmanClocks;
  readonly fileSystemData: unknown;
  readonly plugins: ReadonlyMap<string, void | V8Serializable>;
}

export interface CacheManager {
  /**
   * Called during startup to load initial state, if available. Provided to
   * a crawler, which will return the delta between the initial state and the
   * current file system state.
   */
  read(): Promise<CacheData | undefined | null>;

  /**
   * Called when metro-file-map `build()` has applied changes returned by the
   * crawler - i.e. internal state reflects the current file system state.
   *
   * getSnapshot may be retained and called at any time before end(), such as
   * in response to eventSource 'change' events.
   */
  write(getSnapshot: () => CacheData, opts: CacheManagerWriteOptions): Promise<void>;

  /**
   * The last call that will be made to this CacheManager. Any handles should
   * be closed by the time this settles.
   */
  end(): Promise<void>;
}

export interface CacheManagerEventSource {
  onChange(listener: () => void): () => void /* unsubscribe */;
}

export type CacheManagerFactory = (options: CacheManagerFactoryOptions) => CacheManager;

export interface CacheManagerFactoryOptions {
  readonly buildParameters: BuildParameters;
}

export interface CacheManagerWriteOptions {
  readonly changedSinceCacheRead: boolean;
  readonly eventSource: CacheManagerEventSource;
  readonly onWriteError: (error: Error) => void;
}

// A path that is
//  - Relative to the contextual `rootDir`
//  - Normalised (no extraneous '.' or '..')
//  - Real (no symlinks in path, though the path itself may be a symlink)
export type CanonicalPath = string;

export interface ChangedFileMetadata {
  readonly isSymlink: boolean;
  readonly modifiedTime?: number | undefined | null;
}

export interface ChangeEvent {
  readonly logger: RootPerfLogger | undefined | null;
  readonly changes: ReadonlyFileSystemChanges<ChangedFileMetadata>;
  readonly rootDir: string;
}

export interface ChangeEventMetadata {
  modifiedTime: number | undefined | null; // Epoch ms
  size: number | undefined | null; // Bytes
  type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
}

export type Console = typeof globalThis.console;

interface CrawlerPreviousState {
  readonly clocks: ReadonlyMap<CanonicalPath, WatchmanClockSpec>;
  readonly fileSystem: FileSystem;
}

export interface CrawlerOptions {
  abortSignal: AbortSignal | undefined | null;
  computeSha1: boolean;
  console: Console;
  extensions: readonly string[];
  /** @deprecated */
  forceNodeFilesystemAPI?: boolean;
  ignore: IgnoreMatcher;
  includeSymlinks: boolean;
  perfLogger?: PerfLogger | null | undefined;
  previousState: CrawlerPreviousState;
  rootDir: string;
  roots: readonly string[];
  onStatus: (status: WatcherStatus) => void;
  // Only consider files under this normalized subdirectory when computing
  // removedFiles. If not provided, all files in the file system are considered.
  subpath?: string;
}

export type CrawlResult =
  | {
      changedFiles: FileData;
      removedFiles: Set<Path>;
      clocks: WatchmanClocks;
    }
  | {
      changedFiles: FileData;
      removedFiles: Set<Path>;
    };

export type DependencyExtractor = {
  extract: (
    content: string,
    absoluteFilePath: string,
    defaultExtractor?: DependencyExtractor['extract']
  ) => Set<string>;
  getCacheKey: () => string;
};

export type WatcherStatus =
  | {
      type: 'watchman_slow_command';
      timeElapsed: number;
      command: 'watch-project' | 'query';
    }
  | {
      type: 'watchman_slow_command_complete';
      timeElapsed: number;
      command: 'watch-project' | 'query';
    }
  | {
      type: 'watchman_warning';
      warning: unknown;
      command: 'watch-project' | 'query';
    };

export type DuplicatesSet = Map<string, /* type */ number>;
export type DuplicatesIndex = Map<string, Map<string, DuplicatesSet>>;

interface FileMapPluginInitOptionsFiles<PerFileData = undefined> {
  fileIterator(
    opts: Readonly<{
      includeNodeModules: boolean;
      includeSymlinks: boolean;
    }>
  ): Iterable<{
    baseName: string;
    canonicalPath: string;
    readonly pluginData: PerFileData | null | undefined;
  }>;
  lookup(
    mixedPath: string
  ):
    | { exists: false }
    | { exists: true; type: 'f'; readonly pluginData: PerFileData }
    | { exists: true; type: 'd' };
}

export interface FileMapPluginInitOptions<SerializableState, PerFileData = undefined> {
  readonly files: FileMapPluginInitOptionsFiles<PerFileData>;
  readonly pluginState: SerializableState | undefined | null;
}

interface FileMapPluginWorkerOptions {
  readonly modulePath: string;
  readonly setupArgs: JsonData;
}

export interface FileMapPluginWorker {
  readonly worker: FileMapPluginWorkerOptions;
  readonly filter: (input: { normalPath: string; isNodeModules: boolean }) => boolean;
}

export type V8Serializable =
  | string
  | number
  | boolean
  | null
  | readonly V8Serializable[]
  | ReadonlySet<V8Serializable>
  | ReadonlyMap<string, V8Serializable>
  | Readonly<{ [key: string]: V8Serializable }>;

export interface FileMapPlugin<
  SerializableState extends undefined | V8Serializable = undefined | V8Serializable,
  PerFileData extends undefined | V8Serializable = undefined | V8Serializable,
> {
  readonly name: string;
  initialize(initOptions: FileMapPluginInitOptions<SerializableState, PerFileData>): Promise<void>;
  assertValid(): void;
  onChanged(changes: ReadonlyFileSystemChanges<PerFileData | undefined | null>): void;
  getSerializableSnapshot(): void | V8Serializable;
  getCacheKey(): string;
  getWorker(): FileMapPluginWorker | undefined | null;
}

export type InputFileMapPlugin = FileMapPlugin<never, never>;

export interface MetadataWorkerParams {
  getContent(): Promise<Buffer>;
}

export interface MetadataWorker {
  processFile(
    message: WorkerMessage,
    params: MetadataWorkerParams
  ): V8Serializable | Promise<V8Serializable>;
}

export type IgnoreMatcher = (item: string) => boolean;

export type FileData = Map<CanonicalPath, FileMetadata>;

export type FileMetadata = [
  mtime: number | null,
  size: number,
  visited: 0 | 1,
  sha1: string | null,
  symlink: 0 | 1 | string, // string specifies target, if known
  /* plugindata */
  ...any[],
];

export interface FileStats {
  readonly fileType: 'f' | 'l';
  readonly modifiedTime: number | undefined | null;
  readonly size: number | undefined | null;
}

export interface FileSystem {
  exists(file: Path): boolean;
  getAllFiles(): Path[];

  /**
   * Given a map of files, determine which of them are new or modified
   * (changedFiles), and which of them are missing from the input
   * (removedFiles), vs the current state of this instance of FileSystem.
   */
  getDifference(
    files: FileData,
    options?: Readonly<{
      /**
       * Only consider files under this subpath (which should be a directory)
       * when computing removedFiles. If not provided, all files in the file
       * system are considered.
       */
      subpath?: string;
    }>
  ): {
    changedFiles: FileData;
    removedFiles: Set<string>;
  };

  getSerializableSnapshot(): CacheData['fileSystemData'];
  getMtimeByNormalPath(file: Path): number | undefined | null;
  getSha1(file: Path): string | undefined | null;
  getOrComputeSha1(file: Path): Promise<{ sha1: string; content?: Buffer } | undefined | null>;

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
  hierarchicalLookup(
    mixedStartPath: string,
    subpath: string,
    opts: {
      breakOnSegment: string | undefined | null;
      invalidatedBy: Set<string> | undefined | null;
      subpathType: 'f' | 'd';
    }
  ):
    | {
        absolutePath: string;
        containerRelativePath: string;
      }
    | undefined
    | null;

  /**
   * Analogous to posix lstat. If the file at `file` is a symlink, return
   * information about the symlink without following it.
   */
  linkStats(file: Path): FileStats | undefined | null;

  /**
   * Return information about the given path, whether a directory or file.
   * Always follow symlinks, and return a real path if it exists.
   */
  lookup(mixedPath: Path): LookupResult;

  matchFiles(opts: {
    /* Filter relative paths against a pattern. */
    filter?: RegExp | null | undefined;
    /* `filter` is applied against absolute paths, vs rootDir-relative. (default: false) */
    filterCompareAbsolute?: boolean | undefined;
    /* `filter` is applied against posix-delimited paths, even on Windows. (default: false) */
    filterComparePosix?: boolean | undefined;
    /* Follow symlinks when enumerating paths. (default: false) */
    follow?: boolean | undefined;
    /* Should search for files recursively. (default: true) */
    recursive?: boolean | undefined;
    /* Match files under a given root, or null for all files */
    rootDir?: Path | null | undefined;
  }): Iterable<Path>;
}

export type Glob = string;

export type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData };

export type LookupResult =
  | {
      // The node is missing from the FileSystem implementation (note this
      // could indicate an unwatched path, or a directory containing no watched
      // files).
      exists: false;
      // The real, normal, absolute paths of any symlinks traversed.
      links: ReadonlySet<string>;
      // The real, normal, absolute path of the first path segment
      // encountered that does not exist, or cannot be navigated through.
      missing: string;
    }
  | {
      exists: true;
      // The real, normal, absolute paths of any symlinks traversed.
      links: ReadonlySet<string>;
      // The real, normal, absolute path of the directory.
      realPath: string;
      // Currently lookup always follows symlinks, so can only return
      // directories or regular files, but this may be extended.
      type: 'd';
    }
  | {
      exists: true;
      // The real, normal, absolute paths of any symlinks traversed.
      links: ReadonlySet<string>;
      // The real, normal, absolute path of the file.
      realPath: string;
      // Currently lookup always follows symlinks, so can only return
      // directories or regular files, but this may be extended.
      type: 'f';
      // The file's metadata tuple. Must only be mutated via FileProcessor.
      metadata: FileMetadata;
    };

export interface MockMap {
  getMockModule(name: string): Path | undefined | null;
}

export interface HasteConflict {
  id: string;
  platform: string | null;
  absolutePaths: string[];
  type: 'duplicate' | 'shadowing';
}

export interface HasteMap {
  getModule(
    name: string,
    platform?: string | undefined | null,
    supportsNativePlatform?: boolean | undefined | null,
    type?: HTypeValue | undefined | null
  ): Path | undefined | null;

  getModuleNameByPath(file: Path): string | undefined | null;

  getPackage(
    name: string,
    platform: string | undefined | null,
    _supportsNativePlatform: boolean | undefined | null
  ): Path | undefined | null;

  computeConflicts(): HasteConflict[];
}

export type HasteMapData = Map<string, HasteMapItem>;

// In the Flow source, this type includes `__proto__: null` to indicate that
// instances are created via `Object.create(null)` and have no prototype.
// TypeScript has no equivalent syntax, but this contract is maintained at
// runtime in HastePlugin.ts via `Object.create(null)`.
export type HasteMapItem = {
  [platform: string]: HasteMapItemMetadata;
};

export type HasteMapItemMetadata = [/* path */ string, /* type */ number];

export interface FileSystemListener {
  directoryAdded(canonicalPath: CanonicalPath): void;
  directoryRemoved(canonicalPath: CanonicalPath): void;

  fileAdded(canonicalPath: CanonicalPath, data: FileMetadata): void;
  fileModified(canonicalPath: CanonicalPath, oldData: FileMetadata, newData: FileMetadata): void;
  fileRemoved(canonicalPath: CanonicalPath, data: FileMetadata): void;
}

export interface ReadonlyFileSystemChanges<T = FileMetadata> {
  readonly addedDirectories: Iterable<CanonicalPath>;
  readonly removedDirectories: Iterable<CanonicalPath>;

  readonly addedFiles: Iterable<Readonly<[CanonicalPath, T]>>;
  readonly modifiedFiles: Iterable<Readonly<[CanonicalPath, T]>>;
  readonly removedFiles: Iterable<Readonly<[CanonicalPath, T]>>;
}

export interface MutableFileSystem extends FileSystem {
  remove(filePath: Path, listener?: FileSystemListener | undefined): void;
  addOrModify(
    filePath: Path,
    fileMetadata: FileMetadata,
    listener?: FileSystemListener | undefined
  ): void;
  bulkAddOrModify(addedOrModifiedFiles: FileData, listener?: FileSystemListener | undefined): void;
}

export type Path = string;

type DirectoryNode = Map<string, MixedNode | null>;
type MixedNode = FileMetadata | DirectoryNode;

export interface FallbackFilesystem {
  lookup(
    normalPath: Path,
    absolutePath: string,
    prevNode: MixedNode | null | undefined
  ): MixedNode | null;
  readdir(
    normalPath: Path,
    absolutePath: string,
    dirNode: DirectoryNode | null | undefined
  ): DirectoryNode | null;
}

export type ProcessFileFunction = (
  normalPath: string,
  metadata: FileMetadata,
  request: Readonly<{ computeSha1: boolean }>
) => Promise<Buffer | undefined | null>;

export type RawMockMap = {
  /** posix-separated mock name to posix-separated project-relative paths */
  readonly duplicates: Map<string, Set<string>>;
  /** posix-separated mock name to posix-separated project-relative path */
  readonly mocks: Map<string, Path>;
  readonly version: number;
};

export interface ReadOnlyRawMockMap {
  readonly duplicates: ReadonlyMap<string, ReadonlySet<string>>;
  readonly mocks: ReadonlyMap<string, Path>;
  readonly version: number;
}

export interface WatcherBackend {
  getPauseReason(): string | undefined | null;
  onError(listener: (error: Error) => void): () => void;
  onFileEvent(listener: (event: WatcherBackendChangeEvent) => void): () => void;
  startWatching(): Promise<void>;
  stopWatching(): Promise<void>;
}

export type ChangeEventClock = [absoluteWatchRoot: string, opaqueClock: string];

export type WatcherBackendChangeEvent =
  | {
      readonly event: 'touch';
      readonly clock?: ChangeEventClock | undefined;
      readonly relativePath: string;
      readonly root: string;
      readonly metadata: ChangeEventMetadata;
    }
  | {
      readonly event: 'delete';
      readonly clock?: ChangeEventClock | undefined;
      readonly relativePath: string;
      readonly root: string;
      readonly metadata?: undefined;
    }
  | {
      readonly event: 'recrawl';
      readonly clock?: ChangeEventClock | undefined;
      readonly relativePath: string;
      readonly root: string;
    };

export interface WatcherBackendOptions {
  readonly ignored: RegExp | undefined | null;
  readonly globs: readonly string[];
  readonly dot: boolean;
}

export type WatchmanClockSpec = string | { readonly scm: { readonly 'mergebase-with': string } };

export type WatchmanClocks = Map<Path, WatchmanClockSpec>;

export interface WorkerMessage {
  readonly computeSha1: boolean;
  readonly filePath: string;
  readonly maybeReturnContent: boolean;
  readonly pluginsToRun: readonly number[];
}

export interface WorkerMetadata {
  readonly sha1?: string | undefined | null;
  readonly content?: Buffer | undefined | null;
  readonly pluginData?: readonly V8Serializable[];
}

export interface WorkerSetupArgs {
  readonly plugins?: readonly FileMapPluginWorker['worker'][];
}
