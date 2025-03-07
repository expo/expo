// #region metro-file-map
declare module 'metro-file-map' {
  export * from 'metro-file-map/src/index';
  export { default } from 'metro-file-map/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/cache/DiskCacheManager.js
declare module 'metro-file-map/src/cache/DiskCacheManager' {
  import type {
    BuildParameters,
    CacheData,
    CacheManager,
    CacheManagerFactoryOptions,
    CacheManagerWriteOptions,
  } from 'metro-file-map/src/flow-types';
  type AutoSaveOptions = Readonly<{
    debounceMs: number;
  }>;
  type DiskCacheConfig = {
    autoSave?: Partial<AutoSaveOptions> | boolean;
    cacheFilePrefix?: null | undefined | string;
    cacheDirectory?: null | undefined | string;
  };
  export class DiskCacheManager implements CacheManager {
    constructor($$PARAM_0$$: CacheManagerFactoryOptions, $$PARAM_1$$: DiskCacheConfig);
    static getCacheFilePath(
      buildParameters: BuildParameters,
      cacheFilePrefix?: null | undefined | string,
      cacheDirectory?: null | undefined | string
    ): string;
    getCacheFilePath(): string;
    read(): Promise<null | undefined | CacheData>;
    write(getSnapshot: () => CacheData, $$PARAM_1$$: CacheManagerWriteOptions): Promise<void>;
    end(): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/constants.js
declare module 'metro-file-map/src/constants' {
  const constants: {
    DEPENDENCY_DELIM: '\0';
    ID: 0;
    MTIME: 1;
    SIZE: 2;
    VISITED: 3;
    DEPENDENCIES: 4;
    SHA1: 5;
    SYMLINK: 6;
    PATH: 0;
    TYPE: 1;
    MODULE: 0;
    PACKAGE: 1;
    GENERIC_PLATFORM: 'g';
    NATIVE_PLATFORM: 'native';
  };
  export default constants;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/crawlers/node/hasNativeFindSupport.js
declare module 'metro-file-map/src/crawlers/node/hasNativeFindSupport' {
  function hasNativeFindSupport(): Promise<boolean>;
  export default hasNativeFindSupport;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/crawlers/node/index.js
declare module 'metro-file-map/src/crawlers/node/index' {
  import type { CanonicalPath, CrawlerOptions, FileData } from 'metro-file-map/src/flow-types';
  const $$EXPORT_DEFAULT_DECLARATION$$: (options: CrawlerOptions) => Promise<{
    removedFiles: Set<CanonicalPath>;
    changedFiles: FileData;
  }>;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/crawlers/watchman/index.js
declare module 'metro-file-map/src/crawlers/watchman/index' {
  import type {
    CanonicalPath,
    CrawlerOptions,
    FileData,
    WatchmanClocks,
  } from 'metro-file-map/src/flow-types';
  const $$EXPORT_DEFAULT_DECLARATION$$: ($$PARAM_0$$: CrawlerOptions) => Promise<{
    changedFiles: FileData;
    removedFiles: Set<CanonicalPath>;
    clocks: WatchmanClocks;
  }>;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/crawlers/watchman/planQuery.js
declare module 'metro-file-map/src/crawlers/watchman/planQuery' {
  import type { WatchmanQuery, WatchmanQuerySince } from 'fb-watchman';
  export function planQuery(
    $$PARAM_0$$: Readonly<{
      since?: null | WatchmanQuerySince;
      directoryFilters: readonly string[];
      extensions: readonly string[];
      includeSha1: boolean;
      includeSymlinks: boolean;
    }>
  ): {
    query: WatchmanQuery;
    queryGenerator: string;
  };
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/flow-types.js
declare module 'metro-file-map/src/flow-types' {
  import type { PerfLogger, PerfLoggerFactory, RootPerfLogger } from 'metro-config';
  export type { PerfLoggerFactory, PerfLogger };
  export type BuildParameters = Readonly<{
    computeDependencies: boolean;
    computeSha1: boolean;
    enableHastePackages: boolean;
    enableSymlinks: boolean;
    extensions: readonly string[];
    forceNodeFilesystemAPI: boolean;
    ignorePattern: RegExp;
    mocksPattern?: null | RegExp;
    platforms: readonly string[];
    retainAllFiles: boolean;
    rootDir: string;
    roots: readonly string[];
    skipPackageJson: boolean;
    dependencyExtractor?: null | string;
    hasteImplModulePath?: null | string;
    cacheBreaker: string;
  }>;
  export type BuildResult = {
    fileSystem: FileSystem;
    hasteMap: HasteMap;
    mockMap?: null | MockMap;
  };
  export type CacheData = Readonly<{
    clocks: WatchmanClocks;
    fileSystemData: any;
    plugins: ReadonlyMap<string, any>;
  }>;
  export interface CacheManager {
    /**
     * Called during startup to load initial state, if available. Provided to
     * a crawler, which will return the delta between the initial state and the
     * current file system state.
     */
    read(): Promise<null | undefined | CacheData>;
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
    onChange(listener: () => void): () => void;
  }
  export type CacheManagerFactory = (options: CacheManagerFactoryOptions) => CacheManager;
  export type CacheManagerFactoryOptions = Readonly<{
    buildParameters: BuildParameters;
  }>;
  export type CacheManagerWriteOptions = Readonly<{
    changedSinceCacheRead: boolean;
    eventSource: CacheManagerEventSource;
    onWriteError: ($$PARAM_0$$: Error) => void;
  }>;
  export type CanonicalPath = string;
  export type ChangeEvent = {
    logger?: null | RootPerfLogger;
    eventsQueue: EventsQueue;
  };
  export type ChangeEventMetadata = {
    modifiedTime?: null | number;
    size?: null | number;
    type?: 'f' | 'd' | 'l';
  };
  export type Console = typeof global.console;
  export type CrawlerOptions = {
    abortSignal?: null | AbortSignal;
    computeSha1: boolean;
    console: Console;
    extensions: readonly string[];
    forceNodeFilesystemAPI: boolean;
    ignore: IgnoreMatcher;
    includeSymlinks: boolean;
    perfLogger?: null | undefined | PerfLogger;
    previousState: Readonly<{
      clocks: ReadonlyMap<CanonicalPath, WatchmanClockSpec>;
      fileSystem: FileSystem;
    }>;
    rootDir: string;
    roots: readonly string[];
    onStatus: (status: WatcherStatus) => void;
  };
  export type WatcherStatus =
    | {
        type: 'watchman_slow_command';
        timeElapsed: number;
        command?: 'watch-project' | 'query';
      }
    | {
        type: 'watchman_slow_command_complete';
        timeElapsed: number;
        command?: 'watch-project' | 'query';
      }
    | {
        type: 'watchman_warning';
        warning: any;
        command?: 'watch-project' | 'query';
      };
  export type DuplicatesSet = Map<string, number>;
  export type DuplicatesIndex = Map<string, Map<string, DuplicatesSet>>;
  export type EventsQueue = {
    filePath: Path;
    metadata: ChangeEventMetadata;
    type: string;
  }[];
  export type FileMapDelta = Readonly<{
    removed: Iterable<[CanonicalPath, FileMetaData]>;
    addedOrModified: Iterable<[CanonicalPath, FileMetaData]>;
  }>;
  interface FileSystemState {
    metadataIterator(
      opts: Readonly<{
        includeNodeModules: boolean;
        includeSymlinks: boolean;
      }>
    ): Iterable<{
      baseName: string;
      canonicalPath: string;
      metadata: FileMetaData;
    }>;
  }
  export type FileMapPluginInitOptions<SerializableState> = Readonly<{
    files: FileSystemState;
    pluginState?: null | SerializableState;
  }>;
  type V8Serializable = {};
  export interface FileMapPlugin<SerializableState = V8Serializable> {
    readonly name: string;
    initialize(initOptions: FileMapPluginInitOptions<SerializableState>): Promise<void>;
    assertValid(): void;
    bulkUpdate(delta: FileMapDelta): Promise<void>;
    getSerializableSnapshot(): SerializableState;
    onRemovedFile(relativeFilePath: string, fileMetadata: FileMetaData): void;
    onNewOrModifiedFile(relativeFilePath: string, fileMetadata: FileMetaData): void;
  }
  export type HType = {
    ID: 0;
    MTIME: 1;
    SIZE: 2;
    VISITED: 3;
    DEPENDENCIES: 4;
    SHA1: 5;
    SYMLINK: 6;
    PATH: 0;
    TYPE: 1;
    MODULE: 0;
    PACKAGE: 1;
    GENERIC_PLATFORM: 'g';
    NATIVE_PLATFORM: 'native';
    DEPENDENCY_DELIM: '\0';
  };
  export type HTypeValue = HType[keyof HType];
  export type IgnoreMatcher = (item: string) => boolean;
  export type FileData = Map<CanonicalPath, FileMetaData>;
  export type FileMetaData = [
    string,
    null | undefined | number,
    number,
    0 | 1,
    string,
    null | undefined | string,
    0 | 1 | string,
  ];
  export type FileStats = Readonly<{
    fileType?: 'f' | 'l';
    modifiedTime?: null | number;
    size?: null | number;
  }>;
  export interface FileSystem {
    exists(file: Path): boolean;
    getAllFiles(): Path[];
    getDependencies(file: Path): null | undefined | string[];
    getDifference(files: FileData): {
      changedFiles: FileData;
      removedFiles: Set<string>;
    };
    getModuleName(file: Path): null | undefined | string;
    getSerializableSnapshot(): CacheData['fileSystemData'];
    getSha1(file: Path): null | undefined | string;
    getOrComputeSha1(file: Path): Promise<
      | null
      | undefined
      | {
          sha1: string;
          content?: Buffer;
        }
    >;
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
        breakOnSegment?: null | string;
        invalidatedBy?: null | Set<string>;
        subpathType?: 'f' | 'd';
      }
    ):
      | null
      | undefined
      | {
          absolutePath: string;
          containerRelativePath: string;
        };
    /**
     * Analogous to posix lstat. If the file at `file` is a symlink, return
     * information about the symlink without following it.
     */
    linkStats(file: Path): null | undefined | FileStats;
    /**
     * Return information about the given path, whether a directory or file.
     * Always follow symlinks, and return a real path if it exists.
     */
    lookup(mixedPath: Path): LookupResult;
    matchFiles(opts: {
      filter?: RegExp | null;
      filterCompareAbsolute?: boolean;
      filterComparePosix?: boolean;
      follow?: boolean;
      recursive?: boolean;
      rootDir?: Path | null;
    }): Iterable<Path>;
  }
  export type Glob = string;
  export type LookupResult =
    | {
        exists: false;
        links: ReadonlySet<string>;
        missing: string;
      }
    | {
        exists: true;
        links: ReadonlySet<string>;
        realPath: string;
        type?: 'd' | 'f';
      };
  export interface MockMap {
    getMockModule(name: string): null | undefined | Path;
  }
  export type HasteConflict = {
    id: string;
    platform?: string | null;
    absolutePaths: string[];
    type?: 'duplicate' | 'shadowing';
  };
  export interface HasteMap {
    getModule(
      name: string,
      platform?: null | undefined | string,
      supportsNativePlatform?: null | undefined | boolean,
      type?: null | undefined | HTypeValue
    ): null | undefined | Path;
    getPackage(
      name: string,
      platform: null | undefined | string,
      _supportsNativePlatform: null | undefined | boolean
    ): null | undefined | Path;
    computeConflicts(): HasteConflict[];
  }
  export type HasteMapData = Map<string, HasteMapItem>;
  export type HasteMapItem = {
    [platform: string]: HasteMapItemMetaData;
  };
  export type HasteMapItemMetaData = [string, number];
  export interface MutableFileSystem extends FileSystem {
    remove(filePath: Path): null | undefined | FileMetaData;
    addOrModify(filePath: Path, fileMetadata: FileMetaData): void;
    bulkAddOrModify(addedOrModifiedFiles: FileData): void;
  }
  export type Path = string;
  export type ProcessFileFunction = (
    absolutePath: string,
    metadata: FileMetaData,
    request: Readonly<{
      computeSha1: boolean;
    }>
  ) => Promise<null | undefined | Buffer>;
  export type RawMockMap = Readonly<{
    duplicates: Map<string, Set<string>>;
    mocks: Map<string, Path>;
    version: number;
  }>;
  export type ReadOnlyRawMockMap = Readonly<{
    duplicates: ReadonlyMap<string, ReadonlySet<string>>;
    mocks: ReadonlyMap<string, Path>;
    version: number;
  }>;
  export interface WatcherBackend {
    getPauseReason(): null | undefined | string;
    onError($$PARAM_0$$: (error: Error) => void): () => void;
    onFileEvent($$PARAM_0$$: (event: WatcherBackendChangeEvent) => void): () => void;
    startWatching(): Promise<void>;
    stopWatching(): Promise<void>;
  }
  export type ChangeEventClock = [string, string];
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
      }>;
  export type WatchmanClockSpec =
    | string
    | Readonly<{
        scm: Readonly<{
          'mergebase-with': string;
        }>;
      }>;
  export type WatchmanClocks = Map<Path, WatchmanClockSpec>;
  export type WorkerMessage = Readonly<{
    computeDependencies: boolean;
    computeSha1: boolean;
    dependencyExtractor?: null | undefined | string;
    enableHastePackages: boolean;
    filePath: string;
    hasteImplModulePath?: null | undefined | string;
    maybeReturnContent: boolean;
  }>;
  export type WorkerMetadata = Readonly<{
    dependencies?: null | undefined | readonly string[];
    id?: null | undefined | string;
    sha1?: null | undefined | string;
    content?: null | undefined | Buffer;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/index.js
declare module 'metro-file-map/src/index' {
  import type {
    BuildParameters,
    BuildResult,
    CacheData,
    CacheManager,
    CacheManagerFactory,
    CanonicalPath,
    ChangeEventClock,
    ChangeEventMetadata,
    Console,
    CrawlerOptions,
    FileData,
    FileMapPlugin,
    FileMetaData,
    FileSystem,
    HasteMapData,
    HasteMapItem,
    HType,
    MutableFileSystem,
    Path,
    PerfLogger,
    PerfLoggerFactory,
    WatchmanClocks,
  } from 'metro-file-map/src/flow-types';
  import { FileProcessor } from 'metro-file-map/src/lib/FileProcessor';
  import { RootPathUtils } from 'metro-file-map/src/lib/RootPathUtils';
  import { Watcher } from 'metro-file-map/src/Watcher';
  import EventEmitter from 'events';
  export type {
    BuildParameters,
    BuildResult,
    CacheData,
    ChangeEventMetadata,
    FileData,
    FileMap,
    FileSystem,
    HasteMapData,
    HasteMapItem,
  };
  export type InputOptions = Readonly<{
    computeDependencies?: null | undefined | boolean;
    computeSha1?: null | undefined | boolean;
    enableHastePackages?: boolean;
    enableSymlinks?: null | undefined | boolean;
    enableWorkerThreads?: null | undefined | boolean;
    extensions: readonly string[];
    forceNodeFilesystemAPI?: null | undefined | boolean;
    ignorePattern?: null | undefined | RegExp;
    mocksPattern?: null | undefined | string;
    platforms: readonly string[];
    retainAllFiles: boolean;
    rootDir: string;
    roots: readonly string[];
    skipPackageJson?: null | undefined | boolean;
    dependencyExtractor?: null | undefined | string;
    hasteImplModulePath?: null | undefined | string;
    cacheManagerFactory?: null | undefined | CacheManagerFactory;
    console?: Console;
    healthCheck: HealthCheckOptions;
    maxFilesPerWorker?: null | undefined | number;
    maxWorkers: number;
    perfLoggerFactory?: null | undefined | PerfLoggerFactory;
    resetCache?: null | undefined | boolean;
    throwOnModuleCollision?: null | undefined | boolean;
    useWatchman?: null | undefined | boolean;
    watch?: null | undefined | boolean;
    watchmanDeferStates?: readonly string[];
  }>;
  type HealthCheckOptions = Readonly<{
    enabled: boolean;
    interval: number;
    timeout: number;
    filePrefix: string;
  }>;
  type InternalOptions = Readonly<
    {
      healthCheck: HealthCheckOptions;
      perfLoggerFactory?: null | PerfLoggerFactory;
      resetCache?: null | boolean;
      throwOnModuleCollision: boolean;
      useWatchman: boolean;
      watch: boolean;
      watchmanDeferStates: readonly string[];
    } & BuildParameters
  >;
  export { DiskCacheManager } from 'metro-file-map/src/cache/DiskCacheManager';
  export { DuplicateHasteCandidatesError } from 'metro-file-map/src/plugins/haste/DuplicateHasteCandidatesError';
  export { HasteConflictsError } from 'metro-file-map/src/plugins/haste/HasteConflictsError';
  export { default as HastePlugin } from 'metro-file-map/src/plugins/HastePlugin';
  export type { HasteMap } from 'metro-file-map/src/flow-types';
  export type { HealthCheckResult } from 'metro-file-map/src/Watcher';
  export type {
    CacheManager,
    CacheManagerFactory,
    CacheManagerFactoryOptions,
    CacheManagerWriteOptions,
    ChangeEvent,
    WatcherStatus,
  } from 'metro-file-map/src/flow-types';
  /**
   * FileMap includes a JavaScript implementation of Facebook's haste module system.
   *
   * This implementation is inspired by https://github.com/facebook/node-haste
   * and was built with for high-performance in large code repositories with
   * hundreds of thousands of files. This implementation is scalable and provides
   * predictable performance.
   *
   * Because the haste map creation and synchronization is critical to startup
   * performance and most tasks are blocked by I/O this class makes heavy use of
   * synchronous operations. It uses worker processes for parallelizing file
   * access and metadata extraction.
   *
   * The data structures created by `metro-file-map` can be used directly from the
   * cache without further processing. The metadata objects in the `files` and
   * `map` objects contain cross-references: a metadata object from one can look
   * up the corresponding metadata object in the other map. Note that in most
   * projects, the number of files will be greater than the number of haste
   * modules one module can refer to many files based on platform extensions.
   *
   * type CacheData = {
   *   clocks: WatchmanClocks,
   *   files: {[filepath: string]: FileMetaData},
   *   map: {[id: string]: HasteMapItem},
   *   mocks: {[id: string]: string},
   * }
   *
   * // Watchman clocks are used for query synchronization and file system deltas.
   * type WatchmanClocks = {[filepath: string]: string};
   *
   * type FileMetaData = {
   *   id: ?string, // used to look up module metadata objects in `map`.
   *   mtime: number, // check for outdated files.
   *   size: number, // size of the file in bytes.
   *   visited: boolean, // whether the file has been parsed or not.
   *   dependencies: Array<string>, // all relative dependencies of this file.
   *   sha1: ?string, // SHA-1 of the file, if requested via options.
   *   symlink: ?(1 | 0 | string), // Truthy if symlink, string is target
   * };
   *
   * // Modules can be targeted to a specific platform based on the file name.
   * // Example: platform.ios.js and Platform.android.js will both map to the same
   * // `Platform` module. The platform should be specified during resolution.
   * type HasteMapItem = {[platform: string]: ModuleMetaData};
   *
   * //
   * type ModuleMetaData = {
   *   path: string, // the path to look up the file object in `files`.
   *   type: string, // the module type (either `package` or `module`).
   * };
   *
   * Note that the data structures described above are conceptual only. The actual
   * implementation uses arrays and constant keys for metadata storage. Instead of
   * `{id: 'flatMap', mtime: 3421, size: 42, visited: true, dependencies: []}` the real
   * representation is similar to `['flatMap', 3421, 42, 1, []]` to save storage space
   * and reduce parse and write time of a big JSON blob.
   *
   * The HasteMap is created as follows:
   *  1. read data from the cache or create an empty structure.
   *
   *  2. crawl the file system.
   *     * empty cache: crawl the entire file system.
   *     * cache available:
   *       * if watchman is available: get file system delta changes.
   *       * if watchman is unavailable: crawl the entire file system.
   *     * build metadata objects for every file. This builds the `files` part of
   *       the `HasteMap`.
   *
   *  3. parse and extract metadata from changed files.
   *     * this is done in parallel over worker processes to improve performance.
   *     * the worst case is to parse all files.
   *     * the best case is no file system access and retrieving all data from
   *       the cache.
   *     * the average case is a small number of changed files.
   *
   *  4. serialize the new `HasteMap` in a cache file.
   *
   */
  class FileMap extends EventEmitter {
    _buildPromise: null | undefined | Promise<BuildResult>;
    _canUseWatchmanPromise: Promise<boolean>;
    _changeID: number;
    _changeInterval: null | undefined | NodeJS.Timeout;
    _fileProcessor: FileProcessor;
    _console: Console;
    _options: InternalOptions;
    _pathUtils: RootPathUtils;
    _watcher: null | undefined | Watcher;
    _cacheManager: CacheManager;
    _crawlerAbortController: AbortController;
    _healthCheckInterval: null | undefined | NodeJS.Timeout;
    _startupPerfLogger: null | undefined | PerfLogger;
    static create(options: InputOptions): FileMap;
    constructor(options: InputOptions);
    build(): Promise<BuildResult>;
    read(): Promise<null | undefined | CacheData>;
    _buildFileDelta(previousState: CrawlerOptions['previousState']): Promise<{
      removedFiles: Set<CanonicalPath>;
      changedFiles: FileData;
      clocks?: WatchmanClocks;
    }>;
    _maybeReadLink(filePath: Path, fileMetadata: FileMetaData): null | undefined | Promise<void>;
    _applyFileDelta(
      fileSystem: MutableFileSystem,
      plugins: readonly FileMapPlugin[],
      delta: Readonly<{
        changedFiles: FileData;
        removedFiles: ReadonlySet<CanonicalPath>;
        clocks?: WatchmanClocks;
      }>
    ): Promise<void>;
    _takeSnapshotAndPersist(
      fileSystem: FileSystem,
      clocks: WatchmanClocks,
      plugins: readonly FileMapPlugin[],
      changed: FileData,
      removed: Set<CanonicalPath>
    ): void;
    _watch(
      fileSystem: MutableFileSystem,
      clocks: WatchmanClocks,
      plugins: readonly FileMapPlugin[]
    ): Promise<void>;
    end(): Promise<void>;
    _shouldUseWatchman(): Promise<boolean>;
    _getNextChangeID(): number;
    _updateClock(clocks: WatchmanClocks, newClock?: null | undefined | ChangeEventClock): void;
    static H: HType;
  }
  export default FileMap;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/checkWatchmanCapabilities.js
declare module 'metro-file-map/src/lib/checkWatchmanCapabilities' {
  function checkWatchmanCapabilities(requiredCapabilities: readonly string[]): Promise<{
    version: string;
  }>;
  export default checkWatchmanCapabilities;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/dependencyExtractor.js
declare module 'metro-file-map/src/lib/dependencyExtractor' {
  export function extract(code: any): void;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/DuplicateHasteCandidatesError.js
declare module 'metro-file-map/src/lib/DuplicateHasteCandidatesError' {
  import type { DuplicatesSet } from 'metro-file-map/src/flow-types';
  export class DuplicateHasteCandidatesError extends Error {
    hasteName: string;
    platform: string | null;
    supportsNativePlatform: boolean;
    duplicatesSet: DuplicatesSet;
    constructor(
      name: string,
      platform: string,
      supportsNativePlatform: boolean,
      duplicatesSet: DuplicatesSet
    );
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/fast_path.js
declare module 'metro-file-map/src/lib/fast_path' {
  export function relative(rootDir: string, filename: string): string;
  export function resolve(rootDir: string, normalPath: string): string;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/FileProcessor.js
declare module 'metro-file-map/src/lib/FileProcessor' {
  import type { FileMetaData, PerfLogger } from 'metro-file-map/src/flow-types';
  type ProcessFileRequest = Readonly<{
    /**
     * Populate metadata[H.SHA1] with the SHA1 of the file's contents.
     */
    computeSha1: boolean;
    /**
     * Populate metadata[H.DEPENDENCIES] with unresolved dependency specifiers
     * using the dependencyExtractor provided to the constructor.
     */
    computeDependencies: boolean;
    /**
     * Only if processing has already required reading the file's contents, return
     * the contents as a Buffer - null otherwise. Not supported for batches.
     */
    maybeReturnContent: boolean;
  }>;
  export class FileProcessor {
    constructor(
      opts: Readonly<{
        dependencyExtractor?: null | string;
        enableHastePackages: boolean;
        enableWorkerThreads: boolean;
        hasteImplModulePath?: null | string;
        maxFilesPerWorker?: null | undefined | number;
        maxWorkers: number;
        perfLogger?: null | PerfLogger;
      }>
    );
    processBatch(
      files: readonly [string, FileMetaData][],
      req: ProcessFileRequest
    ): Promise<{
      errors: {
        absolutePath: string;
        error: Error & {
          code: string;
        };
      }[];
    }>;
    processRegularFile(
      absolutePath: string,
      fileMetadata: FileMetaData,
      req: ProcessFileRequest
    ):
      | null
      | undefined
      | Promise<{
          content?: null | Buffer;
        }>;
    end(): Promise<void>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/normalizePathSeparatorsToPosix.js
declare module 'metro-file-map/src/lib/normalizePathSeparatorsToPosix' {
  let normalizePathSeparatorsToPosix: (string: string) => string;
  export default normalizePathSeparatorsToPosix;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/normalizePathSeparatorsToSystem.js
declare module 'metro-file-map/src/lib/normalizePathSeparatorsToSystem' {
  let normalizePathSeparatorsToSystem: (string: string) => string;
  export default normalizePathSeparatorsToSystem;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/RootPathUtils.js
declare module 'metro-file-map/src/lib/RootPathUtils' {
  export class RootPathUtils {
    constructor(rootDir: string);
    getBasenameOfNthAncestor(n: number): string;
    getParts(): readonly string[];
    absoluteToNormal(absolutePath: string): string;
    normalToAbsolute(normalPath: string): string;
    relativeToNormal(relativePath: string): string;
    getAncestorOfRootIdx(normalPath: string): null | undefined | number;
    joinNormalToRelative(
      normalPath: string,
      relativePath: string
    ): {
      normalPath: string;
      collapsedSegments: number;
    };
    relative(from: string, to: string): string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/rootRelativeCacheKeys.js
declare module 'metro-file-map/src/lib/rootRelativeCacheKeys' {
  import type { BuildParameters } from 'metro-file-map/src/flow-types';
  function rootRelativeCacheKeys(buildParameters: BuildParameters): {
    rootDirHash: string;
    relativeConfigHash: string;
  };
  export default rootRelativeCacheKeys;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/sorting.js
declare module 'metro-file-map/src/lib/sorting' {
  export function compareStrings(a: null | string, b: null | string): number;
  export function chainComparators<T>(
    ...comparators: ((a: T, b: T) => number)[]
  ): (a: T, b: T) => number;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/lib/TreeFS.js
declare module 'metro-file-map/src/lib/TreeFS' {
  import type {
    FileData,
    FileMetaData,
    FileStats,
    LookupResult,
    MutableFileSystem,
    Path,
    ProcessFileFunction,
  } from 'metro-file-map/src/flow-types';
  type DirectoryNode = Map<string, MixedNode>;
  type FileNode = FileMetaData;
  type MixedNode = FileNode | DirectoryNode;
  type NormalizedSymlinkTarget = {
    ancestorOfRootIdx?: null | number;
    normalPath: string;
    startOfBasenameIdx: number;
  };
  class TreeFS implements MutableFileSystem {
    constructor($$PARAM_0$$: { rootDir: Path; files?: FileData; processFile: ProcessFileFunction });
    getSerializableSnapshot(): any;
    static fromDeserializedSnapshot($$PARAM_0$$: {
      rootDir: string;
      fileSystemData: DirectoryNode;
      processFile: ProcessFileFunction;
    }): TreeFS;
    getModuleName(mixedPath: Path): null | undefined | string;
    getSize(mixedPath: Path): null | undefined | number;
    getDependencies(mixedPath: Path): null | undefined | string[];
    getDifference(files: FileData): {
      changedFiles: FileData;
      removedFiles: Set<string>;
    };
    getSha1(mixedPath: Path): null | undefined | string;
    getOrComputeSha1(mixedPath: Path): Promise<
      | null
      | undefined
      | {
          sha1: string;
          content?: Buffer;
        }
    >;
    exists(mixedPath: Path): boolean;
    lookup(mixedPath: Path): LookupResult;
    getAllFiles(): Path[];
    linkStats(mixedPath: Path): null | undefined | FileStats;
    matchFiles(
      $$PARAM_0$$: Readonly<{
        filter?: null | undefined | RegExp;
        filterCompareAbsolute?: boolean;
        filterComparePosix?: boolean;
        follow?: boolean;
        recursive?: boolean;
        rootDir?: null | undefined | Path;
      }>
    ): Iterable<Path>;
    addOrModify(mixedPath: Path, metadata: FileMetaData): void;
    bulkAddOrModify(addedOrModifiedFiles: FileData): void;
    remove(mixedPath: Path): null | undefined | FileMetaData;
    _lookupByNormalPath(
      requestedNormalPath: string,
      opts: {
        collectAncestors?: {
          ancestorOfRootIdx?: null | number;
          node: DirectoryNode;
          normalPath: string;
          segmentName: string;
        }[];
        collectLinkPaths?: null | undefined | Set<string>;
        followLeaf?: boolean;
        makeDirectories?: boolean;
        startPathIdx?: number;
        startNode?: DirectoryNode;
        start?: {
          ancestorOfRootIdx?: null | number;
          node: DirectoryNode;
          pathIdx: number;
        };
      }
    ):
      | {
          ancestorOfRootIdx?: null | number;
          canonicalPath: string;
          exists: true;
          node: MixedNode;
          parentNode: DirectoryNode;
        }
      | {
          ancestorOfRootIdx?: null | number;
          canonicalPath: string;
          exists: true;
          node: DirectoryNode;
          parentNode: null;
        }
      | {
          canonicalMissingPath: string;
          missingSegmentName: string;
          exists: false;
        };
    hierarchicalLookup(
      mixedStartPath: string,
      subpath: string,
      opts: {
        breakOnSegment?: null | string;
        invalidatedBy?: null | Set<string>;
        subpathType?: 'f' | 'd';
      }
    ):
      | null
      | undefined
      | {
          absolutePath: string;
          containerRelativePath: string;
        };
    metadataIterator(
      opts: Readonly<{
        includeSymlinks: boolean;
        includeNodeModules: boolean;
      }>
    ): Iterable<{
      baseName: string;
      canonicalPath: string;
      metadata: FileMetaData;
    }>;
    _metadataIterator(
      rootNode: DirectoryNode,
      opts: Readonly<{
        includeSymlinks: boolean;
        includeNodeModules: boolean;
      }>,
      prefix: string
    ): Iterable<{
      baseName: string;
      canonicalPath: string;
      metadata: FileMetaData;
    }>;
    _normalizePath(relativeOrAbsolutePath: Path): string;
    _pathIterator(
      iterationRootNode: DirectoryNode,
      iterationRootParentNode: null | undefined | DirectoryNode,
      ancestorOfRootIdx: null | undefined | number,
      opts: Readonly<{
        alwaysYieldPosix: boolean;
        canonicalPathOfRoot: string;
        follow: boolean;
        recursive: boolean;
        subtreeOnly: boolean;
      }>,
      pathPrefix: string,
      followedLinks: ReadonlySet<FileMetaData>
    ): Iterable<Path>;
    _resolveSymlinkTargetToNormalPath(
      symlinkNode: FileMetaData,
      canonicalPathOfSymlink: Path
    ): NormalizedSymlinkTarget;
    _getFileData(
      filePath: Path,
      opts: {
        followLeaf: boolean;
      }
    ): null | undefined | FileMetaData;
    _cloneTree(root: DirectoryNode): DirectoryNode;
  }
  export default TreeFS;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/haste/computeConflicts.js
declare module 'metro-file-map/src/plugins/haste/computeConflicts' {
  import type { HasteMapItem } from 'metro-file-map/src/flow-types';
  type Conflict = {
    id: string;
    platform?: string | null;
    absolutePaths: string[];
    type?: 'duplicate' | 'shadowing';
  };
  export function computeHasteConflicts(
    $$PARAM_0$$: Readonly<{
      duplicates: ReadonlyMap<string, ReadonlyMap<string, ReadonlyMap<string, number>>>;
      map: ReadonlyMap<string, HasteMapItem>;
      rootDir: string;
    }>
  ): Conflict[];
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/haste/DuplicateHasteCandidatesError.js
declare module 'metro-file-map/src/plugins/haste/DuplicateHasteCandidatesError' {
  import type { DuplicatesSet } from 'metro-file-map/src/flow-types';
  export class DuplicateHasteCandidatesError extends Error {
    hasteName: string;
    platform: string | null;
    supportsNativePlatform: boolean;
    duplicatesSet: DuplicatesSet;
    constructor(
      name: string,
      platform: string,
      supportsNativePlatform: boolean,
      duplicatesSet: DuplicatesSet
    );
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/haste/getPlatformExtension.js
declare module 'metro-file-map/src/plugins/haste/getPlatformExtension' {
  function getPlatformExtension(
    file: string,
    platforms: ReadonlySet<string>
  ): null | undefined | string;
  export default getPlatformExtension;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/haste/HasteConflictsError.js
declare module 'metro-file-map/src/plugins/haste/HasteConflictsError' {
  import type { HasteConflict } from 'metro-file-map/src/flow-types';
  export class HasteConflictsError extends Error {
    constructor(conflicts: readonly HasteConflict[]);
    getDetailedMessage(pathsRelativeToRoot: null | undefined | string): string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/HastePlugin.js
declare module 'metro-file-map/src/plugins/HastePlugin' {
  import type {
    Console,
    DuplicatesSet,
    FileMapDelta,
    FileMapPlugin,
    FileMapPluginInitOptions,
    FileMetaData,
    HasteConflict,
    HasteMap,
    HasteMapItemMetaData,
    HTypeValue,
    Path,
    PerfLogger,
  } from 'metro-file-map/src/flow-types';
  type HasteMapOptions = Readonly<{
    console?: null | undefined | Console;
    enableHastePackages: boolean;
    perfLogger?: null | PerfLogger;
    platforms: ReadonlySet<string>;
    rootDir: Path;
    failValidationOnConflicts: boolean;
  }>;
  class HastePlugin implements HasteMap, FileMapPlugin<null> {
    readonly name: any;
    constructor(options: HasteMapOptions);
    initialize($$PARAM_0$$: FileMapPluginInitOptions<null>): Promise<void>;
    getSerializableSnapshot(): null;
    getModule(
      name: string,
      platform?: null | undefined | string,
      supportsNativePlatform?: null | undefined | boolean,
      type?: null | undefined | HTypeValue
    ): null | undefined | Path;
    getPackage(
      name: string,
      platform: null | undefined | string,
      _supportsNativePlatform?: null | undefined | boolean
    ): null | undefined | Path;
    _getModuleMetadata(
      name: string,
      platform: null | undefined | string,
      supportsNativePlatform: boolean
    ): HasteMapItemMetaData | null;
    _assertNoDuplicates(
      name: string,
      platform: string,
      supportsNativePlatform: boolean,
      relativePathSet: null | undefined | DuplicatesSet
    ): void;
    bulkUpdate(delta: FileMapDelta): Promise<void>;
    onNewOrModifiedFile(relativeFilePath: string, fileMetadata: FileMetaData): void;
    setModule(id: string, module: HasteMapItemMetaData): void;
    onRemovedFile(relativeFilePath: string, fileMetadata: FileMetaData): void;
    assertValid(): void;
    _recoverDuplicates(moduleName: string, relativeFilePath: string): void;
    computeConflicts(): HasteConflict[];
  }
  export default HastePlugin;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/MockPlugin.js
declare module 'metro-file-map/src/plugins/MockPlugin' {
  import type {
    FileMapDelta,
    FileMapPlugin,
    FileMapPluginInitOptions,
    MockMap as IMockMap,
    Path,
    RawMockMap,
  } from 'metro-file-map/src/flow-types';
  export const CACHE_VERSION: 2;
  class MockPlugin implements FileMapPlugin<RawMockMap>, IMockMap {
    readonly name: any;
    constructor($$PARAM_0$$: {
      console: typeof console;
      mocksPattern: RegExp;
      rawMockMap?: RawMockMap;
      rootDir: Path;
      throwOnModuleCollision: boolean;
    });
    initialize($$PARAM_0$$: FileMapPluginInitOptions<RawMockMap>): Promise<void>;
    getMockModule(name: string): null | undefined | Path;
    bulkUpdate(delta: FileMapDelta): Promise<void>;
    onNewOrModifiedFile(relativeFilePath: Path): void;
    onRemovedFile(relativeFilePath: Path): void;
    getSerializableSnapshot(): RawMockMap;
    assertValid(): void;
  }
  export default MockPlugin;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/plugins/mocks/getMockName.js
declare module 'metro-file-map/src/plugins/mocks/getMockName' {
  const getMockName: (filePath: string) => string;
  export default getMockName;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/Watcher.js
declare module 'metro-file-map/src/Watcher' {
  import type {
    Console,
    CrawlerOptions,
    FileData,
    Path,
    PerfLogger,
    WatcherBackend,
    WatcherBackendChangeEvent,
    WatchmanClocks,
  } from 'metro-file-map/src/flow-types';
  import EventEmitter from 'events';
  type CrawlResult = {
    changedFiles: FileData;
    clocks?: WatchmanClocks;
    removedFiles: Set<Path>;
  };
  type WatcherOptions = {
    abortSignal: AbortSignal;
    computeSha1: boolean;
    console: Console;
    enableSymlinks: boolean;
    extensions: readonly string[];
    forceNodeFilesystemAPI: boolean;
    healthCheckFilePrefix: string;
    ignoreForCrawl: ($$PARAM_0$$: string) => boolean;
    ignorePatternForWatch: RegExp;
    previousState: CrawlerOptions['previousState'];
    perfLogger?: null | PerfLogger;
    roots: readonly string[];
    rootDir: string;
    useWatchman: boolean;
    watch: boolean;
    watchmanDeferStates: readonly string[];
  };
  export type HealthCheckResult =
    | {
        type: 'error';
        timeout: number;
        error: Error;
        watcher?: null | string;
      }
    | {
        type: 'success';
        timeout: number;
        timeElapsed: number;
        watcher?: null | string;
      }
    | {
        type: 'timeout';
        timeout: number;
        watcher?: null | string;
        pauseReason?: null | string;
      };
  export class Watcher extends EventEmitter {
    _options: WatcherOptions;
    _backends: readonly WatcherBackend[];
    _instanceId: number;
    _nextHealthCheckId: number;
    _pendingHealthChecks: Map<string, () => void>;
    _activeWatcher: null | undefined | string;
    constructor(options: WatcherOptions);
    crawl(): Promise<CrawlResult>;
    watch(onChange: (change: WatcherBackendChangeEvent) => void): void;
    _handleHealthCheckObservation(basename: string): void;
    close(): void;
    checkHealth(timeout: number): Promise<HealthCheckResult>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/watchers/AbstractWatcher.js
declare module 'metro-file-map/src/watchers/AbstractWatcher' {
  import type { WatcherBackend, WatcherBackendChangeEvent } from 'metro-file-map/src/flow-types';
  export type Listeners = Readonly<{
    onFileEvent: (event: WatcherBackendChangeEvent) => void;
    onError: (error: Error) => void;
  }>;
  export class AbstractWatcher implements WatcherBackend {
    readonly root: string;
    readonly ignored: null | undefined | RegExp;
    readonly globs: readonly string[];
    readonly dot: boolean;
    readonly doIgnore: (path: string) => boolean;
    constructor(
      dir: string,
      $$PARAM_1$$: Readonly<{
        ignored?: null | RegExp;
        globs: readonly string[];
        dot: boolean;
      }>
    );
    onFileEvent(listener: (event: WatcherBackendChangeEvent) => void): () => void;
    onError(listener: (error: Error) => void): () => void;
    startWatching(): Promise<void>;
    stopWatching(): void;
    emitFileEvent(event: Omit<WatcherBackendChangeEvent, 'root'>): void;
    emitError(error: Error): void;
    getPauseReason(): null | undefined | string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/watchers/common.js
declare module 'metro-file-map/src/watchers/common' {
  import type { ChangeEventMetadata } from 'metro-file-map/src/flow-types';
  import type { Stats } from 'fs';
  /**
   * Constants
   */
  export const DELETE_EVENT: 'delete';
  export const TOUCH_EVENT: 'touch';
  export const ALL_EVENT: 'all';
  export type WatcherOptions = Readonly<{
    globs: readonly string[];
    dot: boolean;
    ignored?: null | RegExp;
    watchmanDeferStates: readonly string[];
    watchman?: any;
    watchmanPath?: string;
  }>;
  /**
   * Checks a file relative path against the globs array.
   */
  export function includedByGlob(
    type: null | undefined | ('f' | 'l' | 'd'),
    globs: readonly string[],
    dot: boolean,
    relativePath: string
  ): boolean;
  /**
   * Whether the given filePath matches the given RegExp, after converting
   * (on Windows only) system separators to posix separators.
   *
   * Conversion to posix is for backwards compatibility with the previous
   * anymatch matcher, which normlises all inputs[1]. This may not be consistent
   * with other parts of metro-file-map.
   *
   * [1]: https://github.com/micromatch/anymatch/blob/3.1.1/index.js#L50
   */
  export const posixPathMatchesPattern: (pattern: RegExp, filePath: string) => boolean;
  export function typeFromStat(stat: Stats): null | undefined | ChangeEventMetadata['type'];
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/watchers/FallbackWatcher.js
declare module 'metro-file-map/src/watchers/FallbackWatcher' {
  const $$EXPORT_DEFAULT_DECLARATION$$: any;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/watchers/NativeWatcher.js
declare module 'metro-file-map/src/watchers/NativeWatcher' {
  import { AbstractWatcher } from 'metro-file-map/src/watchers/AbstractWatcher';
  /**
   * NativeWatcher uses Node's native fs.watch API with recursive: true.
   *
   * Supported on macOS (and potentially Windows), because both natively have a
   * concept of recurisve watching, via FSEvents and ReadDirectoryChangesW
   * respectively. Notably Linux lacks this capability at the OS level.
   *
   * Node.js has at times supported the `recursive` option to fs.watch on Linux
   * by walking the directory tree and creating a watcher on each directory, but
   * this fits poorly with the synchronous `watch` API - either it must block for
   * arbitrarily large IO, or it may drop changes after `watch` returns. See:
   * https://github.com/nodejs/node/issues/48437
   *
   * Therefore, we retain a fallback to our own application-level recursive
   * FallbackWatcher for Linux, which has async `startWatching`.
   *
   * On Windows, this watcher could be used in principle, but needs work around
   * some Windows-specific edge cases handled in FallbackWatcher, like
   * deduping file change events, ignoring directory changes, and handling EPERM.
   */
  class NativeWatcher extends AbstractWatcher {
    static isSupported(): boolean;
    constructor(
      dir: string,
      opts: Readonly<{
        ignored?: null | RegExp;
        globs: readonly string[];
        dot: boolean;
      }>
    );
    startWatching(): Promise<void>;
    stopWatching(): Promise<void>;
    _handleEvent(relativePath: string): void;
  }
  export default NativeWatcher;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/watchers/RecrawlWarning.js
declare module 'metro-file-map/src/watchers/RecrawlWarning' {
  class RecrawlWarning {
    static RECRAWL_WARNINGS: RecrawlWarning[];
    static REGEXP: RegExp;
    root: string;
    count: number;
    constructor(root: string, count: number);
    static findByRoot(root: string): null | undefined | RecrawlWarning;
    static isRecrawlWarningDupe(warningMessage: any): boolean;
  }
  export default RecrawlWarning;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/watchers/WatchmanWatcher.js
declare module 'metro-file-map/src/watchers/WatchmanWatcher' {
  import type { WatcherOptions } from 'metro-file-map/src/watchers/common';
  import type { Client, WatchmanFileChange, WatchmanSubscriptionEvent } from 'fb-watchman';
  import { AbstractWatcher } from 'metro-file-map/src/watchers/AbstractWatcher';
  /**
   * Watches `dir`.
   */
  class WatchmanWatcher extends AbstractWatcher {
    client: Client;
    readonly subscriptionName: string;
    watchProjectInfo:
      | null
      | undefined
      | Readonly<{
          relativePath: string;
          root: string;
        }>;
    readonly watchmanDeferStates: readonly string[];
    constructor(dir: string, $$PARAM_1$$: WatcherOptions);
    startWatching(): void;
    _init(onReady: () => void, onError: (error: Error) => void): void;
    _handleChangeEvent(resp: WatchmanSubscriptionEvent): void;
    _handleFileChange(
      changeDescriptor: WatchmanFileChange,
      rawClock: WatchmanSubscriptionEvent['clock']
    ): void;
    stopWatching(): void;
    getPauseReason(): null | undefined | string;
  }
  export default WatchmanWatcher;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/worker.js
declare module 'metro-file-map/src/worker' {
  export function worker(data: any): void;
}

// See: https://github.com/facebook/metro/blob/v0.81.3/packages/metro-file-map/src/workerExclusionList.js
declare module 'metro-file-map/src/workerExclusionList' {
  const extensions: any;
  export default extensions;
}
