// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/index.js (entry point)
declare module '@expo/metro/metro-file-map' {
  export type * from '@expo/metro/metro-file-map/flow-types';
  export type { HealthCheckResult } from '@expo/metro/metro-file-map/Watcher';
  export {
    default,
    DuplicateError,
    DiskCacheManager,
    DuplicateHasteCandidatesError,
    type InputOptions,
  } from 'metro-file-map';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/Watcher.js
declare module '@expo/metro/metro-file-map/Watcher' {
  import type { PerfLogger } from '@expo/metro/metro-config';
  import type {
    CrawlerOptions,
    FileData,
    Path,
    WatchmanClocks,
    ChangeEventMetadata,
  } from '@expo/metro/metro-file-map/flow-types';
  import type { EventEmitter } from 'node:events';
  import type { HealthCheckResult } from 'metro-file-map/src/Watcher';

  export type { HealthCheckResult } from 'metro-file-map/src/Watcher';

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
    ignore: (filePath: string) => boolean;
    ignorePattern: RegExp;
    previousState: CrawlerOptions['previousState'];
    perfLogger: PerfLogger | null | undefined; // ?PerfLogger
    roots: readonly string[];
    rootDir: string;
    useWatchman: boolean;
    watch: boolean;
    watchmanDeferStates: readonly string[];
  };

  export class Watcher extends EventEmitter {
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
    close(): Promise<void>;
    checkHealth(timeout: number): Promise<HealthCheckResult>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/constants.js
declare module '@expo/metro/metro-file-map/constants' {
  const constants: {
    // dependency serialization
    DEPENDENCY_DELIM: string;
    // file map attributes
    ID: 0;
    MTIME: 1;
    SIZE: 2;
    VISITED: 3;
    DEPENDENCIES: 4;
    SHA1: 5;
    SYMLINK: 6;
    // module map attributes
    PATH: 0;
    TYPE: 1;
    // module types
    MODULE: 0;
    PACKAGE: 1;
    // platforms
    GENERIC_PLATFORM: 'g';
    NATIVE_PLATFORM: 'native';
  };

  export default constants;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/flow-types.js
declare module '@expo/metro/metro-file-map/flow-types' {
  import type {
    FileData,
    FileSystem as OriginalFileSystem,
    MutableFileSystem as OriginalMutableFileSystem,
  } from 'metro-file-map/src/flow-types';

  export type {
    BuildParameters,
    CacheData,
    CacheManager,
    CacheManagerFactory,
    ChangeEvent,
    ChangeEventMetadata,
    Console,
    CrawlerOptions,
    DuplicatesIndex,
    DuplicatesSet,
    FileData,
    FileMetaData,
    // FileSystem, // - Incorrect `getRealPath` method added
    FileStats,
    HasteMap,
    HasteMapData,
    HasteMapItem,
    HasteMapItemMetaData,
    HType,
    HTypeValue,
    MockData,
    // MutableFileSystem, - Incorrect `getRealPath` method added
    Path,
    RawHasteMap,
    ReadOnlyRawHasteMap,
    WatcherStatus,
    WatchmanClocks,
    WatchmanClockSpec,
    WorkerMessage,
    WorkerMetadata,
  } from 'metro-file-map/src/flow-types';

  export type FileSystem = Omit<OriginalFileSystem, 'getRealPath'>;
  export type MutableFileSystem = Omit<OriginalMutableFileSystem, 'getRealPath'>;

  export type CacheDelta = Readonly<{
    changed: FileData;
    removed: FileData;
  }>;

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
        // The real, normal, absolute path of the file or directory.
        realPath: string;
        // Currently lookup always follows symlinks, so can only return
        // directories or regular files, but this may be extended.
        type: 'd' | 'f';
      };
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/getMockName.js
// declare module '@expo/metro/metro-file-map/getMockName' {}
// NOTE(cedric): this file seems to be related to tests

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/worker.js
declare module '@expo/metro/metro-file-map/worker' {
  import { WorkerMessage, WorkerMetadata } from '@expo/metro/metro-file-map/flow-types';

  export function worker(data: WorkerMessage): Promise<WorkerMetadata>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/workerExclusionList.js
declare module '@expo/metro/metro-file-map/workerExclusionList' {
  const extensions: Set<string>;
  export default extensions;
}

// #region /cache/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/cache/DiskCacheManager.js
declare module '@expo/metro/metro-file-map/cache/DiskCacheManager' {
  import type {
    BuildParameters,
    CacheDelta,
    CacheData,
    CacheManager,
  } from '@expo/metro/metro-file-map/flow-types';

  type DiskCacheConfig = {
    buildParameters: BuildParameters;
    cacheFilePrefix?: string | null; // ?string
    cacheDirectory?: string | null; // ?string
  };

  export class DiskCacheManager implements CacheManager {
    static getCacheFilePath(
      buildParameters: BuildParameters,
      cacheFilePrefix?: string | null, // ?string
      cacheDirectory?: string | null // ?string
    ): string;

    constructor(options: DiskCacheConfig);

    getCacheFilePath(): string;
    read(): Promise<CacheData | null>; // Promise<?CacheData>
    write(dataSnapshot: CacheData, { changed, removed }: CacheDelta): Promise<void>;
  }
}

// #region /crawlers/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/crawlers/node/hasNativeFindSupport.js
declare module '@expo/metro/metro-file-map/crawlers/node/hasNativeFindSupport' {
  export default function hasNativeFindSupport(): Promise<boolean>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/crawlers/node/index.js
declare module '@expo/metro/metro-file-map/crawlers/node/index' {
  import type { CrawlerOptions, FileData, Path } from '@expo/metro/metro-file-map/flow-types';

  export default function nodeCrawl(options: CrawlerOptions): Promise<{
    removedFiles: Set<Path>;
    changedFiles: FileData;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/crawlers/watchman/index.js
declare module '@expo/metro/metro-file-map/crawlers/watchman/index' {
  import type {
    CrawlerOptions,
    FileData,
    Path,
    WatchmanClocks,
  } from '@expo/metro/metro-file-map/flow-types';

  export default function watchmanCrawl(options: CrawlerOptions): Promise<{
    removedFiles: Set<Path>;
    changedFiles: FileData;
    clocks: WatchmanClocks;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/crawlers/watchman/planQuery.js
declare module '@expo/metro/metro-file-map/crawlers/watchman/planQuery' {
  import type { WatchmanQuery, WatchmanQuerySince } from 'fb-watchman';

  type Options = Readonly<{
    since: WatchmanQuerySince | null; // ?WatchmanQuerySince
    directoryFilters: readonly string[];
    extensions: readonly string[];
    includeSha1: boolean;
    includeSymlinks: boolean;
  }>;

  export default function planQuery(options: Options): {
    query: WatchmanQuery;
    queryGenerator: string;
  };
}

// #region /lib/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/DuplicateError.js
declare module '@expo/metro/metro-file-map/lib/DuplicateError' {
  export class DuplicateError extends Error {
    mockPath1: string;
    mockPath2: string;

    constructor(mockPath1: string, mockPath2: string);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/DuplicateHasteCandidatesError.js
declare module '@expo/metro/metro-file-map/lib/DuplicateHasteCandidatesError' {
  import { DuplicatesSet } from '@expo/metro/metro-file-map/flow-types';

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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/MockMap.js
declare module '@expo/metro/metro-file-map/lib/MockMap' {
  import type { MockData, Path } from '@expo/metro/metro-file-map/flow-types';

  export default class MockMap {
    constructor(options: { rawMockMap: MockData; rootDir: Path });
    getMockModule(name: string): Path | null; // ?Path
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/MutableHasteMap.js
declare module '@expo/metro/metro-file-map/lib/MutableHasteMap' {
  import type {
    Console,
    HasteMap,
    Path,
    RawHasteMap,
    HTypeValue,
    ReadOnlyRawHasteMap,
    HasteMapItemMetaData,
  } from '@expo/metro/metro-file-map/flow-types';

  type HasteMapOptions = Readonly<{
    console?: Console | null; // ?Console
    platforms: ReadonlySet<string>;
    rootDir: Path;
    throwOnModuleCollision: boolean;
  }>;

  export default class MutableHasteMap implements HasteMap {
    static fromDeserializedSnapshot(
      deserializedData: RawHasteMap,
      options: HasteMapOptions
    ): MutableHasteMap;

    constructor(options: HasteMapOptions);

    getSerializableSnapshot(): RawHasteMap;
    getModule(
      name: string,
      platform?: string | null, // ?string
      supportsNativePlatform?: boolean | null, // ?boolean
      type?: HTypeValue // ?HTypeValue
    ): Path | null; // ?Path

    getPackage(
      name: string,
      platform: string | null, // ?string
      _supportsNativePlatform?: boolean | null // ?boolean
    ): Path | null; // ?Path

    // FIXME: This is only used by Meta-internal validation and should be
    // removed or replaced with a less leaky API.
    getRawHasteMap(): ReadOnlyRawHasteMap; // This does NOT return `rootDir`

    setModule(id: string, module: HasteMapItemMetaData): void;
    removeModule(moduleName: string, relativeFilePath: string): void;
    setThrowOnModuleCollision(shouldThrow: boolean): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/RootPathUtils.js
declare module '@expo/metro/metro-file-map/lib/RootPathUtils' {
  export class RootPathUtils {
    constructor(rootDir: string);
    /** absolutePath may be any well-formed absolute path. */
    absoluteToNormal(absolutePath: string): string;
    /** `normalPath` is assumed to be normal (root-relative, no redundant indirection), per the definition above. */
    normalToAbsolute(normalPath: string): string;
    relativeToNormal(relativePath: string): string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/TreeFS.js
declare module '@expo/metro/metro-file-map/lib/TreeFS' {
  import type {
    FileData,
    FileMetaData,
    FileStats,
    LookupResult,
    MutableFileSystem,
    Path,
  } from '@expo/metro/metro-file-map/flow-types';

  type DirectoryNode = Map<string, MixedNode>;
  type FileNode = FileMetaData;
  type MixedNode = FileNode | DirectoryNode;

  export default class TreeFS implements MutableFileSystem {
    static fromDeserializedSnapshot(options: {
      rootDir: string;
      fileSystemData: DirectoryNode;
    }): TreeFS;
    constructor(options: { rootDir: Path; files?: FileData });
    getSerializableSnapshot(): any; // CacheData['fileSystemData'] - Note, this does not exist in the typescript types
    getModuleName(mixedPath: Path): string | null; // ?string
    getSize(mixedPath: Path): number | null; // ?number
    getDependencies(mixedPath: Path): string[] | null; // ?Array<string>
    getDifference(files: FileData): { changedFiles: FileData; removedFiles: Set<string> };
    getSha1(mixedPath: Path): string | null; // ?string
    exists(mixedPath: Path): boolean;
    lookup(mixedPath: Path): LookupResult;
    getAllFiles(): Array<Path>;
    linkStats(mixedPath: Path): FileStats | null; // ?FileStats
    /**
     * Given a search context, return a list of file paths matching the query.
     * The query matches against normalized paths which start with `./`,
     * for example: `a/b.js` -> `./a/b.js`
     */
    matchFiles(
      options: Readonly<{
        /* Filter relative paths against a pattern. */
        filter?: RegExp | null; // ?RegExp
        /* `filter` is applied against absolute paths, vs rootDir-relative. (default: false) */
        filterCompareAbsolute?: boolean;
        /* `filter` is applied against posix-delimited paths, even on Windows. (default: false) */
        filterComparePosix?: boolean;
        /* Follow symlinks when enumerating paths. (default: false) */
        follow?: boolean;
        /* Should search for files recursively. (default: true) */
        recursive?: boolean;
        /* Match files under a given root, or null for all files */
        rootDir?: Path | null; // ?Path
      }>
    ): Iterable<Path>;
    addOrModify(mixedPath: Path, metadata: FileMetaData): void;
    bulkAddOrModify(addedOrModifiedFiles: FileData): void;
    remove(mixedPath: Path): FileMetaData | null; // ?FileMetaData
    metadataIterator(options: { includeSymlinks: boolean; includeNodeModules: boolean }): Iterable<{
      baseName: string;
      canonicalPath: string;
      metadata: FileMetaData;
    }>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/checkWatchmanCapabilities.js
declare module '@expo/metro/metro-file-map/lib/checkWatchmanCapabilities' {
  export default function checkWatchmanCapabilities(
    requiredCapabilities: readonly string[]
  ): Promise<{ version: string }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/dependencyExtractor.js
declare module '@expo/metro/metro-file-map/lib/dependencyExtractor' {
  export function extract(code: string): ReadonlySet<string>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/fast_path.js
declare module '@expo/metro/metro-file-map/lib/fast_path' {
  /**
   * rootDir must be normalized and absolute, filename may be any absolute path.
   * (but will optimally start with rootDir) 
   */
  export function relative(rootDir: string, filename: string): string;

  /**
   * rootDir must be an absolute path and normalPath must be a normal relative
   * path (e.g.: foo/bar or ../foo/bar, but never ./foo or foo/../bar)
   * As of Node 18 this is several times faster than path.resolve, over
   * thousands of real calls with 1-3 levels of indirection.
   */
  export function resolve(rootDir: string, normalPath: string): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/getPlatformExtension.js
declare module '@expo/metro/metro-file-map/lib/getPlatformExtension' {
  /** Extract platform extension: index.ios.js -> ios */
  export default function getPlatformExtension(
    file: string,
    platforms: ReadonlySet<string>,
  ): string | null // ?string
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/normalizePathSeparatorsToPosix.js
declare module '@expo/metro/metro-file-map/lib/normalizePathSeparatorsToPosix' {
  export default function normalizePathSeparatorsToPosix(filePath: string): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/normalizePathSeparatorsToSystem.js
declare module '@expo/metro/metro-file-map/lib/normalizePathSeparatorsToSystem' {
  export default function normalizePathSeparatorsToSystem(filePath): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/lib/rootRelativeCacheKeys.js
declare module '@expo/metro/metro-file-map/lib/rootRelativeCacheKeys' {
  import type { BuildParameters } from '@expo/metro/metro-file-map/flow-types';

  export default function rootRelativeCacheKeys(buildParameters: BuildParameters): {
    rootDirHash: string,
    relativeConfigHash: string,
  };
}

// #region /watchers/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/watchers/FSEventsWatcher.js
declare module '@expo/metro/metro-file-map/watchers/FSEventsWatcher' {
  import type { EventEmitter } from 'node:events';

  type Matcher = any; // TODO

  export default class FSEventsWatcher extends EventEmitter {
    static isSupported(): boolean;
    constructor(
      dir: string,
      options: Readonly<{
        ignored?: Matcher;
        glob: string | readonly string[];
        dot: boolean;
        [key: string]: any; // ...
      }>,
    );
    close(callback?: () => void): Promise<void>;
    getPauseReason(): string | null; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/watchers/NodeWatcher.js
declare module '@expo/metro/metro-file-map/watchers/NodeWatcher' {
  import type { WatcherOptions } from '@expo/metro/metro-file-map/watchers/common';
  import type { EventEmitter } from 'node:events';

  export default class NodeWatcher extends EventEmitter {
    constructor(dir: string, options: WatcherOptions);
    close(): Promise<void>;
    getPauseReason(): string | null; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/watchers/RecrawlWarning.js
declare module '@expo/metro/metro-file-map/watchers/RecrawlWarnings' {
  export default class RecrawlWarning {
    static RECRAWL_WARNINGS: RecrawlWarning[];
    static REGEXP: RegExp;
    static findByRoot(root: string): RecrawlWarning | null; // ?RecrawlWarning
    static isRecrawlWarningDupe(warningMessage: any): boolean;
    constructor(root: string, count: number);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/watchers/WatchmanWatcher.js
declare module '@expo/metro/metro-file-map/watchers/WatchmanWatcher.js' {
  import type { WatcherOptions } from '@expo/metro/metro-file-map/watchers/common';
  import type { EventEmitter } from 'node:events';
  
  export default class WatchmanWatcher extends EventEmitter {
    constructor(dir: string, opts: WatcherOptions);
    close(): Promise<void>;
    getPauseReason(): string | null; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-file-map/src/watchers/common.js
declare module '@expo/metro/metro-file-map/watchers/common' {
  import type { ChangeEventMetadata } from '@expo/metro/metro-file-map/flow-types';
  import type { Stats } from 'node:fs';

  export const CHANGE_EVENT: 'change';
  export const DELETE_EVENT: 'delete';
  export const ADD_EVENT: 'add';
  export const ALL_EVENT: 'all';

  export type WatcherOptions = Readonly<{
    glob: readonly string[],
    dot: boolean,
    ignored: boolean | RegExp,
    watchmanDeferStates: readonly string[],
    watchman?: any,
    watchmanPath?: string,
  }>;

  interface Watcher {
    doIgnore: (filePath: string) => boolean;
    dot: boolean;
    globs: readonly string[];
    ignored?: (boolean | RegExp) | null; // ?(boolean | RegExp)
    watchmanDeferStates: readonly string[];
    watchmanPath?: string | null; // ?string
  }  

  /**
   * Assigns options to the watcher.
   *
   * @param {NodeWatcher|PollWatcher|WatchmanWatcher} watcher
   * @param {?object} opts
   * @return {boolean}
   * @public
   */
  export function assignOptions(watcher: Watcher, options: WatcherOptions): WatcherOptions;

  /**
   * Checks a file relative path against the globs array.
   */
  export function isIncluded(
    type: ('f' | 'l' | 'd') | null, // ?('f' | 'l' | 'd'),
    globs: readonly string[],
    dot: boolean,
    doIgnore: (filePath: string) => boolean,
    relativePath: string,
  ): boolean;

  /**
   * Traverse a directory recursively calling `callback` on every directory.
   */
  export function recReaddir(
    dir: string,
    dirCallback: (filePath: string, fileStats: Stats) => void,
    fileCallback: (filePath: string, fileStats: Stats) => void,
    symlinkCallback: (filePath: string, fileStats: Stats) => void,
    endCallback: () => void,
    errorCallback: (error: Error) => void,
    ignored: (boolean | RegExp) | null, // ?(boolean | RegExp)
  ): void;

  export function typeFromStat(stat: Stats): ChangeEventMetadata['type'] | null; // ?ChangeEventMetadata['type']
}
