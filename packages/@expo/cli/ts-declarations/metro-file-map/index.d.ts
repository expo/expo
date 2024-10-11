// #region metro-file-map
declare module 'metro-file-map' {
  export * from 'metro-file-map/src/index';
  export { default } from 'metro-file-map/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/cache/DiskCacheManager.js
declare module 'metro-file-map/src/cache/DiskCacheManager' {
  import type {
    BuildParameters,
    CacheData,
    CacheDelta,
    CacheManager,
  } from 'metro-file-map/src/flow-types';
  type DiskCacheConfig = {
    buildParameters: BuildParameters;
    cacheFilePrefix?: null | undefined | string;
    cacheDirectory?: null | undefined | string;
  };
  export class DiskCacheManager implements CacheManager {
    _cachePath: string;
    constructor($$PARAM_0$$: DiskCacheConfig);
    static getCacheFilePath(
      buildParameters: BuildParameters,
      cacheFilePrefix?: null | undefined | string,
      cacheDirectory?: null | undefined | string
    ): string;
    getCacheFilePath(): string;
    read(): Promise<null | undefined | CacheData>;
    write(dataSnapshot: CacheData, $$PARAM_1$$: CacheDelta): Promise<void>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/constants.js
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/crawlers/node/hasNativeFindSupport.js
declare module 'metro-file-map/src/crawlers/node/hasNativeFindSupport' {
  function hasNativeFindSupport(): Promise<boolean>;
  export default hasNativeFindSupport;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/crawlers/node/index.js
declare module 'metro-file-map/src/crawlers/node/index' {
  import type { CanonicalPath, CrawlerOptions, FileData } from 'metro-file-map/src/flow-types';
  const $$EXPORT_DEFAULT_DECLARATION$$: (options: CrawlerOptions) => Promise<{
    removedFiles: Set<CanonicalPath>;
    changedFiles: FileData;
  }>;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/crawlers/watchman/index.js
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/crawlers/watchman/planQuery.js
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/flow-types.js
declare module 'metro-file-map/src/flow-types' {
  import type { PerfLogger, PerfLoggerFactory, RootPerfLogger } from 'metro-config';
  import type { AbortSignal } from 'node-abort-controller';
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
    mockMap: MockMap;
  };
  export type CacheData = Readonly<{
    clocks: WatchmanClocks;
    mocks: RawMockMap;
    fileSystemData: any;
  }>;
  export type CacheDelta = Readonly<{
    changed: ReadonlyMap<CanonicalPath, FileMetaData>;
    removed: ReadonlySet<CanonicalPath>;
  }>;
  export interface CacheManager {
    read(): Promise<null | undefined | CacheData>;
    write(dataSnapshot: CacheData, delta: CacheDelta): Promise<void>;
  }
  export type CacheManagerFactory = (buildParameters: BuildParameters) => CacheManager;
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
    metadata?: null | undefined | ChangeEventMetadata;
    type: string;
  }[];
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
    getRawHasteMap(): ReadOnlyRawHasteMap;
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
  export type RawMockMap = Map<string, Path>;
  export type RawHasteMap = {
    duplicates: DuplicatesIndex;
    map: HasteMapData;
  };
  export type ReadOnlyRawHasteMap = Readonly<{
    duplicates: ReadonlyMap<string, ReadonlyMap<string, ReadonlyMap<string, number>>>;
    map: ReadonlyMap<string, HasteMapItem>;
  }>;
  export type ReadOnlyRawMockMap = ReadonlyMap<string, Path>;
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
    readLink: boolean;
    rootDir: string;
    filePath: string;
    hasteImplModulePath?: null | undefined | string;
  }>;
  export type WorkerMetadata = Readonly<{
    dependencies?: null | undefined | readonly string[];
    id?: null | undefined | string;
    module?: null | undefined | HasteMapItemMetaData;
    sha1?: null | undefined | string;
    symlinkTarget?: null | undefined | string;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/getMockName.js
declare module 'metro-file-map/src/getMockName' {
  const getMockName: (filePath: string) => string;
  export default getMockName;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/index.js
declare module 'metro-file-map/src/index' {
  import type {
    BuildParameters,
    BuildResult,
    CacheData,
    CacheManager,
    CacheManagerFactory,
    CanonicalPath,
    ChangeEventMetadata,
    Console,
    CrawlerOptions,
    FileData,
    FileMetaData,
    FileSystem,
    HasteMapData,
    HasteMapItem,
    HType,
    MutableFileSystem,
    Path,
    PerfLogger,
    PerfLoggerFactory,
    RawMockMap,
    ReadOnlyRawMockMap,
    WatchmanClocks,
  } from 'metro-file-map/src/flow-types';
  import MutableHasteMap from 'metro-file-map/src/lib/MutableHasteMap';
  import { RootPathUtils } from 'metro-file-map/src/lib/RootPathUtils';
  import TreeFS from 'metro-file-map/src/lib/TreeFS';
  import { Watcher } from 'metro-file-map/src/Watcher';
  import { worker } from 'metro-file-map/src/worker';
  import EventEmitter from 'events';
  import { AbortController } from 'node-abort-controller';
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
  type InternalOptions = {
    enableWorkerThreads: boolean;
    healthCheck: HealthCheckOptions;
    perfLoggerFactory?: null | PerfLoggerFactory;
    resetCache?: null | boolean;
    maxWorkers: number;
    throwOnModuleCollision: boolean;
    useWatchman: boolean;
    watch: boolean;
    watchmanDeferStates: readonly string[];
  } & BuildParameters;
  type WorkerObj = {
    worker: typeof worker;
  };
  // NOTE(cedric): https://github.com/facebook/metro/blob/a36e992ac74c5497e58b91d99c2bab21c7fa1451/flow-typed/jest-worker.js#L119-L127
  import { Readable } from 'node:stream';
  type IJestWorker<TExposed = object> = Readonly<
    TExposed & {
      getStderr: () => Readable;
      getStdout: () => Readable;
      end: () => Promise<void>;
    }
  >;
  type WorkerInterface = IJestWorker | WorkerObj;
  export { DiskCacheManager } from 'metro-file-map/src/cache/DiskCacheManager';
  export { DuplicateHasteCandidatesError } from 'metro-file-map/src/lib/DuplicateHasteCandidatesError';
  export { default as MutableHasteMap } from 'metro-file-map/src/lib/MutableHasteMap';
  export type { HasteMap } from 'metro-file-map/src/flow-types';
  export type { HealthCheckResult } from 'metro-file-map/src/Watcher';
  export type {
    CacheDelta,
    CacheManager,
    CacheManagerFactory,
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
    _console: Console;
    _options: InternalOptions;
    _pathUtils: RootPathUtils;
    _watcher: null | undefined | Watcher;
    _worker: null | undefined | WorkerInterface;
    _cacheManager: CacheManager;
    _crawlerAbortController: AbortController;
    _healthCheckInterval: null | undefined | NodeJS.Timeout;
    _startupPerfLogger: null | undefined | PerfLogger;
    static create(options: InputOptions): FileMap;
    constructor(options: InputOptions);
    build(): Promise<BuildResult>;
    _constructHasteMap(fileSystem: TreeFS): Promise<MutableHasteMap>;
    read(): Promise<null | undefined | CacheData>;
    _buildFileDelta(previousState: CrawlerOptions['previousState']): Promise<{
      removedFiles: Set<CanonicalPath>;
      changedFiles: FileData;
      clocks?: WatchmanClocks;
    }>;
    _processFile(
      hasteMap: MutableHasteMap,
      mockMap: RawMockMap,
      filePath: Path,
      fileMetadata: FileMetaData,
      workerOptions?: {
        forceInBand?: null | undefined | boolean;
        perfLogger?: null | undefined | PerfLogger;
      }
    ): null | undefined | Promise<void>;
    _applyFileDelta(
      fileSystem: MutableFileSystem,
      hasteMap: MutableHasteMap,
      mockMap: RawMockMap,
      delta: Readonly<{
        changedFiles: FileData;
        removedFiles: ReadonlySet<CanonicalPath>;
        clocks?: WatchmanClocks;
      }>
    ): Promise<void>;
    _cleanup(): void;
    _takeSnapshotAndPersist(
      fileSystem: FileSystem,
      clocks: WatchmanClocks,
      hasteMap: MutableHasteMap,
      mockMap: ReadOnlyRawMockMap,
      changed: FileData,
      removed: Set<CanonicalPath>
    ): void;
    _getWorker(options?: {
      forceInBand?: null | undefined | boolean;
      perfLogger?: null | undefined | PerfLogger;
    }): WorkerInterface;
    _removeIfExists(
      fileSystem: MutableFileSystem,
      hasteMap: MutableHasteMap,
      mockMap: RawMockMap,
      relativeFilePath: Path
    ): void;
    _watch(
      fileSystem: MutableFileSystem,
      hasteMap: MutableHasteMap,
      mockMap: RawMockMap
    ): Promise<void>;
    end(): Promise<void>;
    _ignore(filePath: Path): boolean;
    _shouldUseWatchman(): Promise<boolean>;
    _getNextChangeID(): number;
    static H: HType;
  }
  export default FileMap;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/checkWatchmanCapabilities.js
declare module 'metro-file-map/src/lib/checkWatchmanCapabilities' {
  function checkWatchmanCapabilities(requiredCapabilities: readonly string[]): Promise<{
    version: string;
  }>;
  export default checkWatchmanCapabilities;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/dependencyExtractor.js
declare module 'metro-file-map/src/lib/dependencyExtractor' {
  export function extract(code: any): void;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/DuplicateError.js
declare module 'metro-file-map/src/lib/DuplicateError' {
  export class DuplicateError extends Error {
    mockPath1: string;
    mockPath2: string;
    constructor(mockPath1: string, mockPath2: string);
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/DuplicateHasteCandidatesError.js
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/fast_path.js
declare module 'metro-file-map/src/lib/fast_path' {
  export function relative(rootDir: string, filename: string): string;
  export function resolve(rootDir: string, normalPath: string): string;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/getPlatformExtension.js
declare module 'metro-file-map/src/lib/getPlatformExtension' {
  function getPlatformExtension(
    file: string,
    platforms: ReadonlySet<string>
  ): null | undefined | string;
  export default getPlatformExtension;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/MockMap.js
declare module 'metro-file-map/src/lib/MockMap' {
  import type { MockMap as IMockMap, Path, RawMockMap } from 'metro-file-map/src/flow-types';
  class MockMap implements IMockMap {
    constructor($$PARAM_0$$: { rawMockMap: RawMockMap; rootDir: Path });
    getMockModule(name: string): null | undefined | Path;
  }
  export default MockMap;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/MutableHasteMap.js
declare module 'metro-file-map/src/lib/MutableHasteMap' {
  import type {
    Console,
    DuplicatesSet,
    HasteMap,
    HasteMapItemMetaData,
    HTypeValue,
    Path,
    RawHasteMap,
    ReadOnlyRawHasteMap,
  } from 'metro-file-map/src/flow-types';
  type HasteMapOptions = Readonly<{
    console?: null | undefined | Console;
    platforms: ReadonlySet<string>;
    rootDir: Path;
    throwOnModuleCollision: boolean;
  }>;
  class MutableHasteMap implements HasteMap {
    constructor(options: HasteMapOptions);
    static fromDeserializedSnapshot(
      deserializedData: RawHasteMap,
      options: HasteMapOptions
    ): MutableHasteMap;
    getSerializableSnapshot(): RawHasteMap;
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
    getRawHasteMap(): ReadOnlyRawHasteMap;
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
    setModule(id: string, module: HasteMapItemMetaData): void;
    removeModule(moduleName: string, relativeFilePath: string): void;
    setThrowOnModuleCollision(shouldThrow: boolean): void;
    _recoverDuplicates(moduleName: string, relativeFilePath: string): void;
  }
  export default MutableHasteMap;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/normalizePathSeparatorsToPosix.js
declare module 'metro-file-map/src/lib/normalizePathSeparatorsToPosix' {
  let normalizePathSeparatorsToPosix: (string: string) => string;
  export default normalizePathSeparatorsToPosix;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/normalizePathSeparatorsToSystem.js
declare module 'metro-file-map/src/lib/normalizePathSeparatorsToSystem' {
  let normalizePathSeparatorsToSystem: (string: string) => string;
  export default normalizePathSeparatorsToSystem;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/RootPathUtils.js
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/rootRelativeCacheKeys.js
declare module 'metro-file-map/src/lib/rootRelativeCacheKeys' {
  import type { BuildParameters } from 'metro-file-map/src/flow-types';
  function rootRelativeCacheKeys(buildParameters: BuildParameters): {
    rootDirHash: string;
    relativeConfigHash: string;
  };
  export default rootRelativeCacheKeys;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/lib/TreeFS.js
declare module 'metro-file-map/src/lib/TreeFS' {
  import type {
    FileData,
    FileMetaData,
    FileStats,
    LookupResult,
    MutableFileSystem,
    Path,
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
    constructor($$PARAM_0$$: { rootDir: Path; files?: FileData });
    getSerializableSnapshot(): any;
    static fromDeserializedSnapshot($$PARAM_0$$: {
      rootDir: string;
      fileSystemData: DirectoryNode;
    }): TreeFS;
    getModuleName(mixedPath: Path): null | undefined | string;
    getSize(mixedPath: Path): null | undefined | number;
    getDependencies(mixedPath: Path): null | undefined | string[];
    getDifference(files: FileData): {
      changedFiles: FileData;
      removedFiles: Set<string>;
    };
    getSha1(mixedPath: Path): null | undefined | string;
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
    metadataIterator(opts: { includeSymlinks: boolean; includeNodeModules: boolean }): Iterable<{
      baseName: string;
      canonicalPath: string;
      metadata: FileMetaData;
    }>;
    _metadataIterator(
      rootNode: DirectoryNode,
      opts: {
        includeSymlinks: boolean;
        includeNodeModules: boolean;
      },
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/Watcher.js
declare module 'metro-file-map/src/Watcher' {
  import type {
    ChangeEventMetadata,
    Console,
    CrawlerOptions,
    FileData,
    Path,
    PerfLogger,
    WatchmanClocks,
  } from 'metro-file-map/src/flow-types';
  import type { AbortSignal } from 'node-abort-controller';
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
    ignore: ($$PARAM_0$$: string) => boolean;
    ignorePattern: RegExp;
    previousState: CrawlerOptions['previousState'];
    perfLogger?: null | PerfLogger;
    roots: readonly string[];
    rootDir: string;
    useWatchman: boolean;
    watch: boolean;
    watchmanDeferStates: readonly string[];
  };
  interface WatcherBackend {
    getPauseReason(): null | undefined | string;
    close(): Promise<void>;
  }
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
    watch(
      onChange: (
        type: string,
        filePath: string,
        root: string,
        metadata: ChangeEventMetadata
      ) => void
    ): void;
    _handleHealthCheckObservation(basename: string): void;
    close(): void;
    checkHealth(timeout: number): Promise<HealthCheckResult>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/watchers/common.js
declare module 'metro-file-map/src/watchers/common' {
  import type { ChangeEventMetadata } from 'metro-file-map/src/flow-types';
  import type { Stats } from 'fs';
  /**
   * Constants
   */
  export const CHANGE_EVENT: 'change';
  export const DELETE_EVENT: 'delete';
  export const ADD_EVENT: 'add';
  export const ALL_EVENT: 'all';
  export type WatcherOptions = Readonly<{
    glob: readonly string[];
    dot: boolean;
    ignored?: boolean | RegExp;
    watchmanDeferStates: readonly string[];
    watchman?: any;
    watchmanPath?: string;
  }>;
  interface Watcher {
    doIgnore: ($$PARAM_0$$: string) => boolean;
    dot: boolean;
    globs: readonly string[];
    ignored?: null | undefined | (boolean | RegExp);
    watchmanDeferStates: readonly string[];
    watchmanPath?: null | undefined | string;
  }
  /**
   * Assigns options to the watcher.
   *
   * @param {NodeWatcher|PollWatcher|WatchmanWatcher} watcher
   * @param {?object} opts
   * @return {boolean}
   * @public
   */
  export const assignOptions: (watcher: Watcher, opts: WatcherOptions) => WatcherOptions;
  /**
   * Checks a file relative path against the globs array.
   */
  export function isIncluded(
    type: null | undefined | ('f' | 'l' | 'd'),
    globs: readonly string[],
    dot: boolean,
    doIgnore: ($$PARAM_0$$: string) => boolean,
    relativePath: string
  ): boolean;
  /**
   * Traverse a directory recursively calling `callback` on every directory.
   */
  export function recReaddir(
    dir: string,
    dirCallback: ($$PARAM_0$$: string, $$PARAM_1$$: Stats) => void,
    fileCallback: ($$PARAM_0$$: string, $$PARAM_1$$: Stats) => void,
    symlinkCallback: ($$PARAM_0$$: string, $$PARAM_1$$: Stats) => void,
    endCallback: () => void,
    errorCallback: ($$PARAM_0$$: Error) => void,
    ignored: null | undefined | (boolean | RegExp)
  ): void;
  export function typeFromStat(stat: Stats): null | undefined | ChangeEventMetadata['type'];
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/watchers/FSEventsWatcher.js
declare module 'metro-file-map/src/watchers/FSEventsWatcher' {
  import type { ChangeEventMetadata } from 'metro-file-map/src/flow-types';
  import type { Stats } from 'fs';
  import EventEmitter from 'events';
  // import anymatch from "anymatch";
  // type Matcher = typeof anymatch.Matcher;
  // NOTE(cedric): incorrectly typed
  import { Matcher } from 'anymatch';
  const CHANGE_EVENT: 'change';
  const DELETE_EVENT: 'delete';
  const ADD_EVENT: 'add';
  const ALL_EVENT: 'all';
  type FsEventsWatcherEvent =
    | typeof CHANGE_EVENT
    | typeof DELETE_EVENT
    | typeof ADD_EVENT
    | typeof ALL_EVENT;
  /**
   * Export `FSEventsWatcher` class.
   * Watches `dir`.
   */
  class FSEventsWatcher extends EventEmitter {
    readonly root: string;
    readonly ignored: null | undefined | Matcher;
    readonly glob: readonly string[];
    readonly dot: boolean;
    readonly doIgnore: (path: string) => boolean;
    readonly fsEventsWatchStopper: () => Promise<void>;
    _tracked: Set<string>;
    static isSupported(): boolean;
    static _normalizeProxy(
      callback: (normalizedPath: string, stats: Stats) => void
    ): (filepath: string, stats: Stats) => void;
    static _recReaddir(
      dir: string,
      dirCallback: (normalizedPath: string, stats: Stats) => void,
      fileCallback: (normalizedPath: string, stats: Stats) => void,
      symlinkCallback: (normalizedPath: string, stats: Stats) => void,
      endCallback: Function,
      errorCallback: Function,
      ignored?: Matcher
    ): void;
    constructor(
      dir: string,
      opts: Readonly<{
        ignored?: Matcher;
        glob?: string | readonly string[];
        dot: boolean;
      }>
    );
    close(callback?: () => void): Promise<void>;
    _handleEvent(filepath: string): void;
    _emit(type: FsEventsWatcherEvent, file: string, metadata?: ChangeEventMetadata): void;
    getPauseReason(): null | undefined | string;
  }
  export default FSEventsWatcher;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/watchers/NodeWatcher.js
declare module 'metro-file-map/src/watchers/NodeWatcher' {
  const $$EXPORT_DEFAULT_DECLARATION$$: any;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/watchers/RecrawlWarning.js
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

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/watchers/WatchmanWatcher.js
declare module 'metro-file-map/src/watchers/WatchmanWatcher' {
  import type { ChangeEventMetadata } from 'metro-file-map/src/flow-types';
  import type { WatcherOptions } from 'metro-file-map/src/watchers/common';
  import type { Client, WatchmanFileChange, WatchmanSubscriptionEvent } from 'fb-watchman';
  import EventEmitter from 'events';
  /**
   * Watches `dir`.
   */
  class WatchmanWatcher extends EventEmitter {
    client: Client;
    dot: boolean;
    doIgnore: ($$PARAM_0$$: string) => boolean;
    globs: readonly string[];
    root: string;
    subscriptionName: string;
    watchProjectInfo:
      | null
      | undefined
      | Readonly<{
          relativePath: string;
          root: string;
        }>;
    watchmanDeferStates: readonly string[];
    constructor(dir: string, opts: WatcherOptions);
    _init(): void;
    _handleChangeEvent(resp: WatchmanSubscriptionEvent): void;
    _handleFileChange(changeDescriptor: WatchmanFileChange): void;
    _emitEvent(
      eventType: string,
      filepath: string,
      root: string,
      changeMetadata?: ChangeEventMetadata
    ): void;
    close(): void;
    getPauseReason(): null | undefined | string;
  }
  export default WatchmanWatcher;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/worker.js
declare module 'metro-file-map/src/worker' {
  export function worker(data: any): void;
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-file-map/src/workerExclusionList.js
declare module 'metro-file-map/src/workerExclusionList' {
  const extensions: any;
  export default extensions;
}
