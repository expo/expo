/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from 'events';
import type { BuildParameters, BuildResult, CacheData, CacheManagerFactory, ChangeEventMetadata, Console, FileData, FileSystem, HasteMapData, HasteMapItem, HType, InputFileMapPlugin, PerfLoggerFactory } from './types';
export type { BuildParameters, BuildResult, CacheData, ChangeEventMetadata, FileData, FileMap, FileSystem, HasteMapData, HasteMapItem, InputFileMapPlugin, };
export interface InputOptions {
    readonly computeSha1?: boolean | undefined | null;
    readonly enableFallback?: boolean | undefined | null;
    readonly enableSymlinks?: boolean | undefined | null;
    readonly extensions: readonly string[];
    readonly forceNodeFilesystemAPI?: boolean | undefined | null;
    readonly ignorePattern?: RegExp | undefined | null;
    readonly plugins?: readonly InputFileMapPlugin[] | undefined;
    readonly retainAllFiles: boolean;
    readonly rootDir: string;
    readonly roots: readonly string[];
    readonly scopeFallback?: boolean | undefined | null;
    readonly serverRoot?: string | undefined | null;
    readonly cacheManagerFactory?: CacheManagerFactory | undefined | null;
    readonly console?: Console;
    readonly healthCheck: HealthCheckOptions;
    readonly maxFilesPerWorker?: number | undefined | null;
    readonly maxWorkers: number;
    readonly perfLoggerFactory?: PerfLoggerFactory | undefined | null;
    readonly resetCache?: boolean | undefined | null;
    readonly useWatchman?: boolean | undefined | null;
    readonly watch?: boolean | undefined | null;
    readonly watchmanDeferStates?: readonly string[];
}
interface HealthCheckOptions {
    readonly enabled: boolean;
    readonly interval: number;
    readonly timeout: number;
    readonly filePrefix: string;
}
export { DiskCacheManager } from './cache/DiskCacheManager';
export { default as DependencyPlugin } from './plugins/DependencyPlugin';
export type { DependencyPluginOptions } from './plugins/DependencyPlugin';
export { DuplicateHasteCandidatesError } from './plugins/haste/DuplicateHasteCandidatesError';
export { HasteConflictsError } from './plugins/haste/HasteConflictsError';
export { default as HastePlugin } from './plugins/HastePlugin';
export type { HasteMap } from './types';
export type { HealthCheckResult } from './Watcher';
export type { CacheManager, CacheManagerFactory, CacheManagerFactoryOptions, CacheManagerWriteOptions, ChangeEvent, DependencyExtractor, WatcherStatus, } from './types';
/**
 * FileMap includes a JavaScript implementation of Facebook's haste module system.
 *
 * This implementation is inspired by https://github.com/facebook/node-haste
 * and was built with for high-performance in large code repositories with
 * hundreds of thousands of files. This implementation is scalable and provides
 * predictable performance.
 *
 * Because the file map creation and synchronization is critical to startup
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
 *   files: {[filepath: string]: FileMetadata},
 *   map: {[id: string]: HasteMapItem},
 *   mocks: {[id: string]: string},
 * }
 *
 * // Watchman clocks are used for query synchronization and file system deltas.
 * type WatchmanClocks = {[filepath: string]: string};
 *
 * type FileMetadata = {
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
 * type HasteMapItem = {[platform: string]: ModuleMetadata};
 *
 * //
 * type ModuleMetadata = {
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
 * The FileMap is created as follows:
 *  1. read data from the cache or create an empty structure.
 *
 *  2. crawl the file system.
 *     * empty cache: crawl the entire file system.
 *     * cache available:
 *       * if watchman is available: get file system delta changes.
 *       * if watchman is unavailable: crawl the entire file system.
 *     * build metadata objects for every file. This builds the `files` part of
 *       the `FileMap`.
 *
 *  3. visit and extract metadata from changed files, including sha1,
 *     depedendencies, and any plugins.
 *     * this is done in parallel over worker processes to improve performance.
 *     * the worst case is to visit all files.
 *     * the best case is no file system access and retrieving all data from
 *       the cache.
 *     * the average case is a small number of changed files.
 *
 *  4. serialize the new `FileMap` in a cache file.
 *
 */
export default class FileMap extends EventEmitter {
    #private;
    readonly __expo = true;
    static create(options: InputOptions): FileMap;
    constructor(options: InputOptions);
    build(): Promise<BuildResult>;
    /**
     * 1. read data from the cache or create an empty structure.
     */
    read(): Promise<CacheData | undefined | null>;
    end(): Promise<void>;
    static H: HType;
}
