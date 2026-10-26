/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Structural mirrors of `metro-config`'s perf logger types, so the file map can take Metro's
// `unstable_perfLoggerFactory` without depending on Metro.
type PerfAnnotations = Partial<{
  string: Readonly<{ [key: string]: string }>;
  int: Readonly<{ [key: string]: number }>;
  double: Readonly<{ [key: string]: number }>;
  bool: Readonly<{ [key: string]: boolean }>;
  string_array: Readonly<{ [key: string]: readonly string[] }>;
  int_array: Readonly<{ [key: string]: readonly number[] }>;
  double_array: Readonly<{ [key: string]: readonly number[] }>;
  bool_array: Readonly<{ [key: string]: readonly boolean[] }>;
}>;

type PerfLoggerPointOptions = Readonly<{ timestamp?: number }>;

export interface PerfLogger {
  point(name: string, opts?: PerfLoggerPointOptions): void;
  annotate(annotations: PerfAnnotations): void;
  subSpan(label: string): PerfLogger;
}

export interface RootPerfLogger extends PerfLogger {
  start(opts?: PerfLoggerPointOptions): void;
  end(status: 'SUCCESS' | 'FAIL' | 'CANCEL', opts?: PerfLoggerPointOptions): void;
}

export type PerfLoggerFactory = (
  type: 'START_UP' | 'BUNDLING_REQUEST' | 'HMR',
  opts?: Readonly<{ key?: number }>
) => RootPerfLogger;

// These inputs affect the internal data collected for a given filesystem
// state, and changes may invalidate a cache.
export type BuildParameters = Readonly<{
  computeSha1: boolean;
  enableSymlinks: boolean;
  extensions: readonly string[];
  ignorePattern: RegExp | null;
  plugins: readonly InputFileMapPlugin[];
  retainAllFiles: boolean;
  rootDir: string;
  roots: readonly string[];

  cacheBreaker: string;
}>;

export type BuildResult = {
  fileSystem: FileSystem;
};

export type CacheData = Readonly<{
  clocks: WatchmanClocks;
  fileSystemData: unknown;
  plugins: ReadonlyMap<string, void | V8Serializable>;
}>;

export interface CacheManager {
  /**
   * Called during startup to load initial state, if available. Provided to
   * a crawler, which will return the delta between the initial state and the
   * current file system state.
   */
  read(): Promise<CacheData | null | undefined>;

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

export type CacheManagerFactoryOptions = Readonly<{
  buildParameters: BuildParameters;
}>;

export type CacheManagerWriteOptions = Readonly<{
  changedSinceCacheRead: boolean;
  eventSource: CacheManagerEventSource;
  onWriteError: (error: Error) => void;
}>;

// A path that is
//  - Relative to the contextual `rootDir`
//  - Normalised (no extraneous '.' or '..')
//  - Real (no symlinks in path, though the path itself may be a symlink)
export type CanonicalPath = string;

/**
 * A directory whose files a file map holds.
 */
export type FileMapRoot = Readonly<{
  absolutePath: string;
  // Relative to `rootDir`, in the form of other paths relative to it, which
  // reaches a root on another Windows drive as if the drive were a top-level
  // directory, e.g. `..\..\D:\foo`. Empty for `rootDir` itself.
  rootRelativePath: string;
  // Whether the root was added after construction, rather than given in
  // `roots`.
  dynamic: boolean;
}>;

export type ChangedFileMetadata = Readonly<{
  isSymlink: boolean;
  modifiedTime?: number | null | undefined;
}>;

export type ChangeEvent = Readonly<{
  logger?: RootPerfLogger | null | undefined;
  changes: ReadonlyFileSystemChanges<Readonly<ChangedFileMetadata>>;
  rootDir: string;
}>;

export type ChangeEventMetadata = {
  modifiedTime: number | null | undefined; // Epoch ms
  size: number | null | undefined; // Bytes
  type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
};

export type Console = typeof globalThis.console;

export type CrawlerOptions = {
  abortSignal?: AbortSignal | null | undefined;
  computeSha1: boolean;
  console: Console;
  extensions: readonly string[];
  ignore: IgnoreMatcher;
  includeSymlinks: boolean;
  perfLogger?: PerfLogger | null | undefined;
  previousState: Readonly<{
    clocks: ReadonlyMap<CanonicalPath, WatchmanClockSpec>;
    fileSystem: FileSystem;
  }>;
  rootDir: string;
  roots: readonly string[];
  onStatus: (status: WatcherStatus) => void;
  // Only consider files under this normalized subdirectory when computing
  // removedFiles. If not provided, all files in the file system are considered.
  subpath?: string;
};

export type CrawlResult =
  | {
      changedFiles: FileData;
      removedFiles: Set<Path>;
      clocks: WatchmanClocks;
    }
  | {
      changedFiles: FileData;
      removedFiles: Set<Path>;
      clocks?: undefined;
    };

/**
 * Discovers files under `roots`, as a delta against `previousState`. This is
 * the contract implemented by the built-in Watchman and node crawlers, and by
 * any crawler supplied to `Watcher`.
 */
export type Crawler = (options: CrawlerOptions) => Promise<CrawlResult>;

export type CrawlerFactoryOptions = Readonly<{
  buildParameters: BuildParameters;

  /**
   * Maps a plugin's `name` to the index within `FileMetadata` reserved for its
   * per-file data. Plugins that declare no worker have no reserved slot and are
   * absent from this map.
   *
   * A crawler that can supply plugin data itself - rather than leaving it to
   * the plugin's worker - writes it at these indices.
   */
  pluginDataIndices: ReadonlyMap<string, number>;
}>;

/**
 * Replaces the built-in Watchman/node crawlers. Called once per `FileMap`,
 * before the first crawl, with context that is fixed for that `FileMap`'s
 * lifetime; the returned `Crawler` is called for the initial crawl and for any
 * subsequent re-crawl.
 *
 * Only crawling is replaced. Watch mode, if enabled, still uses the built-in
 * watcher backends.
 */
export type CrawlerFactory = (options: CrawlerFactoryOptions) => Crawler;
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

export type FileMapPluginInitOptions<SerializableState, PerFileData = void> = Readonly<{
  files: Readonly<{
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
    lookup(mixedPath: string): { exists: false } | { exists: true; type: 'f' | 'd' };
  }>;
  pluginState: SerializableState | null | undefined;
  /**
   * This plugin's data for the regular file at `mixedPath`. Throws if the
   * plugin has no worker.
   *
   * A lazy plugin's worker is run on a file, synchronously and in-band, the
   * first time its data is asked for, and again after the file changes. The
   * result is stored, with `undefined` replaced by `null`.
   *
   * A non-lazy plugin's worker has already run on every file it can give
   * non-null data for, so a file it has not run on (eg, one its filter
   * excludes) has `null` data, without running it.
   *
   * If `observations` is given, records what the result depends upon: a
   * regular file found in `content`, since its data is derived from what it
   * holds, and otherwise as `FileSystem.lookup` does. This is the same whether
   * the data was stored or computed.
   */
  getOrComputeFileData: (
    mixedPath: string,
    observations?: Observations | null | undefined
  ) => FileDataResult<PerFileData>;
}>;

export type FileDataResult<PerFileData> =
  | Readonly<{ exists: false }>
  | Readonly<{ exists: true; type: 'd' }>
  | Readonly<{
      exists: true;
      type: 'f';
      // The real, absolute path of the file.
      realPath: string;
      data: PerFileData | null | undefined;
    }>;

export type FileMapPluginWorker = Readonly<{
  worker: Readonly<{
    modulePath: string;
    setupArgs: JsonData;
  }>;
  /**
   * Whether the worker runs on a given file as it is crawled or changed.
   * This applies to files under node_modules too, which a plugin may reject
   * using `isNodeModules`.
   */
  filter: (file: { normalPath: string; isNodeModules: boolean }) => boolean;
  /**
   * If true, the worker is not run on files as they are crawled or changed,
   * and `filter` is not consulted. It runs only on the files the plugin asks
   * for, through the `getOrComputeFileData` it is given on initialization. Use this
   * where a small, unpredictable subset of matching files is ever needed.
   */
  lazy?: boolean;
}>;

type V8SerializablePrimitive = string | number | boolean | null;

type V8SerializableCollection =
  | readonly V8Serializable[]
  | ReadonlySet<V8Serializable>
  | ReadonlyMap<string, V8Serializable>
  | Readonly<{ [key: string]: V8Serializable }>;

export type V8Serializable = V8SerializablePrimitive | V8SerializableCollection;

export interface FileMapPlugin<
  SerializableState extends void | V8Serializable = void | V8Serializable,
  PerFileData extends void | V8Serializable = void | V8Serializable,
> {
  readonly name: string;
  initialize(initOptions: FileMapPluginInitOptions<SerializableState, PerFileData>): Promise<void>;
  assertValid(): void;
  onChanged(changes: ReadonlyFileSystemChanges<PerFileData | null | undefined>): void;
  getSerializableSnapshot(): void | V8Serializable;
  getCacheKey(): string;
  getWorker(): FileMapPluginWorker | null | undefined;
}

export type InputFileMapPlugin = FileMapPlugin<never, never>;

export interface MetadataWorker {
  processFile(
    message: WorkerMessage,
    utils: Readonly<{ getContent: () => Buffer }>
  ): V8Serializable;
}

export type HType = {
  MTIME: 0;
  SIZE: 1;
  VISITED: 2;
  SHA1: 3;
  SYMLINK: 4;
  PLUGINDATA: number;
  PATH: 0;
  TYPE: 1;
  MODULE: 0;
  PACKAGE: 1;
  GENERIC_PLATFORM: 'g';
  NATIVE_PLATFORM: 'native';
};

export type HTypeValue = HType[keyof HType];

export type IgnoreMatcher = (item: string) => boolean;

export type FileData = Map<CanonicalPath, FileMetadata>;

export type FileMetadata = [
  mtime: number | null | undefined,
  size: number,
  visited: 0 | 1,
  sha1: string | null | undefined,
  // A string is the symlink's target, lexically resolved to a normal path with
  // POSIX separators, if known. The target need not exist.
  symlink: 0 | 1 | string,
  /* plugindata - one slot per plugin with a worker, `undefined` until run */
  ...pluginData: unknown[],
];

export type FileStats = Readonly<{
  fileType: 'f' | 'l';
  modifiedTime: number | null | undefined;
  size: number | null | undefined;
}>;

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
  getSha1(file: Path): string | null | undefined;
  getOrComputeSha1(file: Path): Promise<{ sha1: string; content?: Buffer } | null | undefined>;

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
   * If `observations` is given, records the paths this result depends upon.
   *
   * Useful for finding the closest package scope (subpath: package.json,
   * type f, breakOnSegment: node_modules) or closest potential package root
   * (subpath: node_modules/pkg, type: d) in Node.js resolution.
   */
  hierarchicalLookup(
    mixedStartPath: string,
    subpath: string,
    opts: {
      breakOnSegment?: string | null | undefined;
      subpathType: 'f' | 'd';
    },
    observations?: Observations | null | undefined
  ):
    | {
        absolutePath: string;
        containerRelativePath: string;
      }
    | null
    | undefined;

  /**
   * Analogous to posix lstat. If the file at `file` is a symlink, return
   * information about the symlink without following it.
   */
  linkStats(file: Path): FileStats | null | undefined;

  /**
   * Return information about the given path, whether a directory or file.
   * Always follow symlinks, and return a real path if it exists.
   *
   * If `observations` is given, records the paths this result depends upon:
   * any symlink traversed, and either the real path found or the first path
   * segment that did not exist.
   */
  lookup(mixedPath: Path, observations?: Observations | null | undefined): LookupResult;

  matchFiles(opts: {
    /* Filter relative paths against a pattern. */
    filter?: RegExp | null;
    /* `filter` is applied against absolute paths, vs rootDir-relative. (default: false) */
    filterCompareAbsolute?: boolean;
    /* `filter` is applied against posix-delimited paths, even on Windows. (default: false) */
    filterComparePosix?: boolean;
    /* Follow symlinks when enumerating paths. (default: false) */
    follow?: boolean;
    /* Should search for files recursively. (default: true) */
    recursive?: boolean;
    /* Match files under a given root, or null for all files */
    rootDir?: Path | null;
  }): Iterable<Path>;
}

export type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData };

export type LookupResult =
  | {
      // The node is missing from the FileSystem implementation (note this
      // could indicate an unwatched path, or a directory containing no watched
      // files).
      exists: false;
    }
  | {
      exists: true;
      // The directory's path relative to the root, with symlinks resolved.
      canonicalPath: CanonicalPath;
      // The real, normal, absolute path of the directory.
      realPath: string;
      // Currently lookup always follows symlinks, so can only return
      // directories or regular files, but this may be extended.
      type: 'd';
    }
  | {
      exists: true;
      // The file's path relative to the root, with symlinks resolved.
      canonicalPath: CanonicalPath;
      // The real, normal, absolute path of the file.
      realPath: string;
      // Currently lookup always follows symlinks, so can only return
      // directories or regular files, but this may be extended.
      type: 'f';
      // The file's metadata tuple. Must only be mutated via FileProcessor.
      metadata: FileMetadata;
    };

/**
 * A mutable record of what a query observed of the file system, sufficient to
 * decide later whether its answer may have changed.
 *
 * The parameter is optional and may be omitted for performance.
 */
export interface Observations {
  /**
   * Paths that were observed to exist, or not to exist. Invalidated by added or
   * removed files or directories.
   *
   * Non-existence is always recorded against the *topmost* missing path, not
   * the path asked for, so an absent directory collapses every query beneath
   * it to one entry: a missing `node_modules` is one path invalidating every
   * package resolution under it, rather than one per package.
   */
  readonly existence: Set<CanonicalPath>;

  /**
   * Files whose content was observed (including traversed symlinks, whose
   * content is their target) and directories whose immediate entries were
   * enumerated. Invalidated by modification, as well as by addition or
   * removal, so a path here may also be in `existence` (eg, after a `lookup`
   * and a content read of the same file) without changing what invalidates
   * the result.
   */
  readonly content: Set<CanonicalPath>;
}

export interface MockMap {
  getMockModule(name: string): Path | null | undefined;
}

export type HasteConflict = {
  id: string;
  platform: string | null;
  absolutePaths: string[];
  type: 'duplicate' | 'shadowing';
};

export interface HasteMap {
  getModule(
    name: string,
    platform?: string | null | undefined,
    supportsNativePlatform?: boolean | null | undefined,
    type?: HTypeValue | null | undefined
  ): Path | null | undefined;

  getModuleNameByPath(file: Path): string | null | undefined;

  getPackage(
    name: string,
    platform: string | null | undefined,
    _supportsNativePlatform: boolean | null | undefined
  ): Path | null | undefined;

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
  remove(filePath: Path, listener?: FileSystemListener): void;
  addOrModify(filePath: Path, fileMetadata: FileMetadata, listener?: FileSystemListener): void;
  bulkAddOrModify(addedOrModifiedFiles: FileData, listener?: FileSystemListener): void;
}

export type Path = string;

export type ProcessFileFunction = (
  normalPath: string,
  metadata: FileMetadata,
  request: Readonly<{ computeSha1: boolean }>
) => Buffer | null | undefined;

export type RawMockMap = Readonly<{
  duplicates: Map<
    string, // posix-separated mock name
    Set<string> // posix-separated, project-relative paths
  >;
  mocks: Map<
    string, // posix-separated mock name
    Path // posix-separated, project-relative pathf
  >;
  version: number;
}>;

export type ReadOnlyRawMockMap = Readonly<{
  duplicates: ReadonlyMap<string, ReadonlySet<string>>;
  mocks: ReadonlyMap<string, Path>;
  version: number;
}>;

export interface WatcherBackend {
  getPauseReason(): string | null | undefined;
  onError(listener: (error: Error) => void): () => void;
  onFileEvent(listener: (event: WatcherBackendChangeEvent) => void): () => void;
  startWatching(): Promise<void>;
  stopWatching(): Promise<void>;
}

export type ChangeEventClock = [absoluteWatchRoot: string, opaqueClock: string];

export type WatcherBackendChangeEvent =
  | Readonly<{
      event: 'touch';
      clock?: ChangeEventClock;
      relativePath: string;
      root: string;
      metadata: ChangeEventMetadata;
    }>
  | Readonly<{
      event: 'delete';
      clock?: ChangeEventClock;
      relativePath: string;
      root: string;
      metadata?: void;
    }>
  | Readonly<{
      event: 'recrawl';
      clock?: ChangeEventClock;
      relativePath: string;
      root: string;
    }>;

export type WatcherBackendOptions = Readonly<{
  ignored: RegExp | null | undefined;
  included: WatcherIncludedFiles | null | undefined;
}>;

/**
 * Regular files a watcher reports changes to: those matching any of the
 * extensions (without a leading dot), basenames, or basename prefixes.
 */
export type WatcherIncludedFiles = Readonly<{
  extensions: ReadonlySet<string>;
  basenames: ReadonlySet<string>;
  basenamePrefixes: readonly string[];
}>;

export type WatchmanClockSpec = string | Readonly<{ scm: Readonly<{ 'mergebase-with': string }> }>;
export type WatchmanClocks = Map<Path, WatchmanClockSpec>;

export type WorkerMessage = Readonly<{
  computeSha1: boolean;
  filePath: string;
  maybeReturnContent: boolean;
  pluginsToRun: readonly number[];
}>;

export type WorkerMetadata = Readonly<{
  sha1?: string | null | undefined;
  content?: Buffer | null | undefined;
  pluginData?: readonly V8Serializable[];
}>;

export type WorkerSetupArgs = Readonly<{
  plugins?: readonly FileMapPluginWorker['worker'][];
}>;
