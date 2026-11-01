/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import debugModule from 'debug';
import EventEmitter from 'events';
import { promises as fsPromises } from 'fs';
import invariant from 'invariant';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { Watcher } from './Watcher';
import { DiskCacheManager } from './cache/DiskCacheManager';
import H from './constants';
import createFallbackFilesystem from './crawlers/node/fallback';
import { debugEvent, event } from './events';
import { FileProcessor } from './lib/FileProcessor';
import { FileSystemChangeAggregator } from './lib/FileSystemChangeAggregator';
import { RootPathUtils } from './lib/RootPathUtils';
import TreeFS from './lib/TreeFS';
import checkWatchmanCapabilities from './lib/checkWatchmanCapabilities';
import normalizePathSeparatorsToPosix from './lib/normalizePathSeparatorsToPosix';
import normalizePathSeparatorsToSystem from './lib/normalizePathSeparatorsToSystem';
import removeOverlappingRoots from './lib/removeOverlappingRoots';
import type {
  BuildParameters,
  BuildResult,
  CacheData,
  CacheManager,
  CacheManagerFactory,
  CacheManagerFactoryOptions,
  CanonicalPath,
  ChangedFileMetadata,
  ChangeEvent,
  ChangeEventClock,
  ChangeEventMetadata,
  Console,
  Crawler,
  CrawlerFactory,
  CrawlerOptions,
  CrawlResult,
  FileData,
  FileMapPlugin,
  FileMapPluginWorker,
  FileMapRoot,
  FileMetadata,
  FileSystem,
  HasteMapData,
  HasteMapItem,
  HType,
  InputFileMapPlugin,
  MutableFileSystem,
  Path,
  PerfLogger,
  PerfLoggerFactory,
  ProcessFileFunction,
  WatcherBackendChangeEvent,
  WatchmanClocks,
} from './types';

const debug = debugModule('Metro:FileMap');

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
  InputFileMapPlugin,
};

export type InputOptions = Readonly<{
  computeSha1?: boolean | null | undefined;
  /**
   * Populate paths outside `roots` from the filesystem when they are first
   * looked up (the on-demand filesystem). Default: true.
   */
  enableFallback?: boolean | null | undefined;
  enableSymlinks?: boolean | null | undefined;
  extensions: readonly string[];
  ignorePattern?: RegExp | null | undefined;
  plugins?: readonly InputFileMapPlugin[];
  retainAllFiles: boolean;
  rootDir: string;
  roots: readonly string[];
  /**
   * Limit the on-demand filesystem to `serverRoot` and below, except through a
   * symlink. Default: true.
   */
  scopeFallback?: boolean | null | undefined;
  /** The directory `scopeFallback` limits the on-demand filesystem to. */
  serverRoot?: string | null | undefined;

  cacheManagerFactory?: CacheManagerFactory | null | undefined;
  console?: Console;
  /**
   * Replaces the built-in Watchman/node crawlers. Watch mode, if enabled, still
   * uses the built-in watcher backends.
   */
  crawlerFactory?: CrawlerFactory | null | undefined;
  healthCheck: HealthCheckOptions;
  maxFilesPerWorker?: number | null | undefined;
  maxWorkers: number;
  perfLoggerFactory?: PerfLoggerFactory | null | undefined;
  resetCache?: boolean | null | undefined;
  useWatchman?: boolean | null | undefined;
  watch?: boolean | null | undefined;
  watchmanDeferStates?: readonly string[];
}>;

type HealthCheckOptions = Readonly<{
  enabled: boolean;
  interval: number;
  timeout: number;
  filePrefix: string;
}>;

type InternalOptions = Readonly<
  BuildParameters & {
    enableFallback: boolean;
    scopeFallback: boolean;
    serverRoot: string | null | undefined;
    healthCheck: HealthCheckOptions;
    perfLoggerFactory: PerfLoggerFactory | null | undefined;
    resetCache: boolean | null | undefined;
    useWatchman: boolean;
    watch: boolean;
    watchmanDeferStates: readonly string[];
  }
>;

type IndexedPlugin = Readonly<{
  // Plugin types cannot be known statically
  plugin: FileMapPlugin<any, any>;
  dataIdx: number | null | undefined;
}>;
type InternalEnqueuedEvent = Readonly<
  | {
      clock: ChangeEventClock | null | undefined;
      relativeFilePath: string;
      metadata: FileMetadata;
      type: 'touch';
    }
  | {
      clock: ChangeEventClock | null | undefined;
      relativeFilePath: string;
      metadata?: undefined;
      type: 'delete';
    }
>;

export { DiskCacheManager } from './cache/DiskCacheManager';
export { NoopCacheManager } from './cache/NoopCacheManager';
export { default as DependencyPlugin } from './plugins/DependencyPlugin';
export { default as FileDataPlugin } from './plugins/FileDataPlugin';
export type { FileDataPluginOptions } from './plugins/FileDataPlugin';
export type { DependencyPluginOptions } from './plugins/DependencyPlugin';
export { DuplicateHasteCandidatesError } from './plugins/haste/DuplicateHasteCandidatesError';
export { HasteConflictsError } from './plugins/haste/HasteConflictsError';
export { default as HastePlugin } from './plugins/HastePlugin';

export type { HasteMap } from './types';
export type { HealthCheckResult } from './Watcher';
export type {
  CacheManager,
  CacheManagerFactory,
  CacheManagerFactoryOptions,
  CacheManagerWriteOptions,
  ChangeEvent,
  Crawler,
  CrawlerFactory,
  CrawlerFactoryOptions,
  CrawlerOptions,
  CrawlResult,
  DependencyExtractor,
  FileDataResult,
  FileMapRoot,
  WatcherStatus,
} from './types';

// This should be bumped whenever a code change to `metro-file-map` itself
// would cause a change to the cache data structure and/or content (for a given
// filesystem state and build parameters).
const CACHE_BREAKER = '13';

const CHANGE_INTERVAL = 30;

const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const WATCHMAN_REQUIRED_CAPABILITIES = [
  'field-content.sha1hex',
  'relative_root',
  'suffix-set',
  'wildmatch',
];

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
 *   symlink: ?(1 | 0 | string), // Truthy if symlink, string is the target,
 *                               // lexically resolved to a normal POSIX path
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
 *     dependencies, and any plugins.
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
  // NOTE(@kitten): Expo brand to recognize patched `metro-file-map -> @expo/metro-file-map`
  readonly __expo = true;

  #buildPromise: Promise<BuildResult> | null | undefined;
  readonly #cacheManager: CacheManager;
  #canUseWatchmanPromise: Promise<boolean> | undefined;
  #changeID: number;
  // Serializes changes to the built file system: watcher events and roots
  // added by `addRoot`.
  #changeQueue: Promise<null | void> = Promise.resolve();
  #changeInterval: ReturnType<typeof setInterval> | null | undefined;
  readonly #console: Console;
  readonly #crawlerAbortController: AbortController;
  readonly #fileProcessor: FileProcessor;
  #healthCheckInterval: ReturnType<typeof setInterval> | null | undefined;
  readonly #options: InternalOptions;
  #roots: readonly FileMapRoot[];
  readonly #pathUtils: RootPathUtils;
  readonly #crawler: Crawler | null | undefined;
  // Roots added by `addRoot`, mapped to the completion of each addition.
  readonly #dynamicRoots: Map<string, Promise<void>> = new Map();
  #fileSystem: TreeFS | null | undefined;
  // Applies and emits watcher events waiting on the change interval. Set in
  // watch mode.
  #flushPendingChanges: (() => void) | null | undefined;
  readonly #plugins: readonly IndexedPlugin[];
  readonly #startupPerfLogger: PerfLogger | null | undefined;
  #watcher: Watcher | null | undefined;
  #usedWatchman: boolean = false;

  static create(options: InputOptions): FileMap {
    return new FileMap(options);
  }

  constructor(options: InputOptions) {
    super();

    if (options.perfLoggerFactory) {
      this.#startupPerfLogger = options.perfLoggerFactory?.('START_UP').subSpan('fileMap') ?? null;
      this.#startupPerfLogger?.point('constructor_start');
    }

    // NOTE(@robhogan): VCS directories are excluded by the crawlers and watchers directly (see
    // `isWatcherExcluded`), rather than by appending them to `ignorePattern`
    const ignorePattern: RegExp | null = options.ignorePattern ?? null;
    if (ignorePattern != null && !(ignorePattern instanceof RegExp)) {
      throw new Error('metro-file-map: the `ignorePattern` option must be a RegExp');
    }

    this.#console = options.console || globalThis.console;

    let dataSlot: number = H.PLUGINDATA;

    const indexedPlugins: IndexedPlugin[] = [];
    const pluginWorkers: FileMapPluginWorker[] = [];
    const pluginDataIndices = new Map<string, number>();
    const plugins = options.plugins ?? [];
    for (const plugin of plugins) {
      const maybeWorker = plugin.getWorker();
      const dataIdx = maybeWorker != null ? dataSlot++ : null;
      indexedPlugins.push({ plugin, dataIdx });
      if (dataIdx != null) {
        // Crawlers address plugin data by name, so names must be unique among
        // plugins holding a slot - otherwise a crawler would silently write to
        // the shadowed plugin's slot.
        invariant(
          !pluginDataIndices.has(plugin.name),
          'metro-file-map: Duplicate plugin name: %s',
          plugin.name
        );
        pluginDataIndices.set(plugin.name, dataIdx);
      }
      if (maybeWorker != null) {
        pluginWorkers.push(maybeWorker);
      }
    }
    this.#plugins = indexedPlugins;

    // NOTE(@robhogan): The on-demand filesystem is on by default. Neither option is a build
    // parameter, since neither changes what is crawled
    const enableFallback = options.enableFallback ?? true;
    const scopeFallback = options.scopeFallback ?? true;

    const buildParameters: BuildParameters = {
      cacheBreaker: CACHE_BREAKER,
      computeSha1: options.computeSha1 || false,
      enableSymlinks: options.enableSymlinks || false,
      extensions: options.extensions,
      ignorePattern,
      plugins,
      retainAllFiles: options.retainAllFiles,
      rootDir: options.rootDir,
      // NOTE(@robhogan): Roots are resolved and deduplicated, and roots nested inside another
      // root are dropped, so overlapping watch folders aren't crawled and watched twice
      roots: removeOverlappingRoots(options.roots),
    };

    this.#options = {
      ...buildParameters,
      healthCheck: options.healthCheck,
      perfLoggerFactory: options.perfLoggerFactory,
      resetCache: options.resetCache,
      // NOTE(@robhogan): Watchman is opt-in, where upstream defaults `useWatchman` to `true`
      useWatchman: options.useWatchman ?? false,
      watch: !!options.watch,
      watchmanDeferStates: options.watchmanDeferStates ?? [],
      enableFallback,
      scopeFallback: enableFallback && scopeFallback,
      serverRoot: options.serverRoot,
    };

    this.#crawler = options.crawlerFactory
      ? options.crawlerFactory.call(null, { buildParameters, pluginDataIndices })
      : null;

    const cacheFactoryOptions: CacheManagerFactoryOptions = {
      buildParameters,
    };
    this.#cacheManager = options.cacheManagerFactory
      ? options.cacheManagerFactory.call(null, cacheFactoryOptions)
      : new DiskCacheManager(cacheFactoryOptions, {});

    this.#fileProcessor = new FileProcessor({
      maxFilesPerWorker: options.maxFilesPerWorker,
      maxWorkers: options.maxWorkers,
      perfLogger: this.#startupPerfLogger,
      pluginWorkers,
      rootDir: options.rootDir,
    });

    this.#buildPromise = null;
    this.#pathUtils = new RootPathUtils(options.rootDir);
    this.#roots = this.#options.roots.map((absolutePath) => ({
      absolutePath,
      rootRelativePath: this.#pathUtils.absoluteToNormal(absolutePath),
      dynamic: false,
    }));
    this.#startupPerfLogger?.point('constructor_end');
    this.#crawlerAbortController = new AbortController();
    this.#changeID = 0;
  }

  build(): Promise<BuildResult> {
    this.#startupPerfLogger?.point('build_start');
    if (!this.#buildPromise) {
      const doneBuild = event.span();
      this.#buildPromise = (async () => {
        const doneHydrate = debugEvent.span();
        let initialData: CacheData | null | undefined;
        if (this.#options.resetCache !== true) {
          initialData = await this.read();
        }
        if (!initialData) {
          debug('Not using a cache');
        } else {
          debug('Cache loaded (%d clock(s))', initialData.clocks.size);
        }

        const rootDir = this.#options.rootDir;
        this.#startupPerfLogger?.point('constructFileSystem_start');
        const processFile: ProcessFileFunction = (normalPath, metadata, opts) => {
          const result = this.#fileProcessor.processRegularFile(normalPath, metadata, {
            computeSha1: opts.computeSha1,
            maybeReturnContent: true,
          });
          debug('Lazily processed file: %s', normalPath);
          // Emit an event to inform caches that there is new data to save.
          this.emit('metadata');
          return result?.content;
        };
        const ignorePattern = this.#options.ignorePattern;
        const fallbackFilesystem = this.#options.enableFallback
          ? createFallbackFilesystem({
              rootPathUtils: this.#pathUtils,
              extensions: this.#options.extensions,
              ignore: ignorePattern ? (filePath) => ignorePattern.test(filePath) : () => false,
              includeSymlinks: this.#options.enableSymlinks,
            })
          : null;
        // Watchman lists a symlinked root's files under its real path. A custom
        // crawler's files may not be on disk.
        const realRoots =
          this.#crawler == null
            ? await Promise.all(
                this.#options.roots.map((root) => fsPromises.realpath(root).catch(() => root))
              )
            : [];
        // NOTE(@robhogan): The file system's snapshot holds only what is under these roots, so
        // they include the real paths of symlinked roots
        const roots = removeOverlappingRoots([...this.#options.roots, ...realRoots]);
        const serverRoot = this.#options.scopeFallback ? this.#options.serverRoot : null;
        const fileSystem =
          initialData != null
            ? TreeFS.fromDeserializedSnapshot({
                // Typed `unknown` because we've read this from an external
                // source. It'd be too expensive to validate at runtime, so
                // trust our cache manager that this is correct.
                fileSystemData: initialData.fileSystemData as Parameters<
                  typeof TreeFS.fromDeserializedSnapshot
                >[0]['fileSystemData'],
                processFile,
                rootDir,
                fallbackFilesystem,
                roots,
                serverRoot,
              })
            : new TreeFS({ processFile, rootDir, fallbackFilesystem, roots, serverRoot });
        this.#startupPerfLogger?.point('constructFileSystem_end');
        doneHydrate('hydrate', { fromCache: initialData != null });

        const plugins = this.#plugins;

        // Initialize plugins from cached file system and plugin state while
        // crawling to build a diff of current state vs cached. `fileSystem`
        // is not mutated during either operation.
        const [fileDelta] = await Promise.all([
          this.#buildFileDelta({
            clocks: initialData?.clocks ?? new Map(),
            fileSystem,
          }),
          Promise.all(
            plugins.map(({ plugin, dataIdx }) => {
              const isLazy = plugin.getWorker()?.lazy === true;
              return plugin.initialize({
                files: {
                  lookup: (mixedPath) => {
                    const result = fileSystem.lookup(mixedPath);
                    return result.exists ? { exists: true, type: result.type } : { exists: false };
                  },
                  fileIterator: (opts) =>
                    mapIterable(
                      fileSystem.metadataIterator(opts),
                      ({ baseName, canonicalPath, metadata }) => ({
                        baseName,
                        canonicalPath,
                        pluginData: dataIdx != null ? metadata[dataIdx] : null,
                      })
                    ),
                },
                pluginState: initialData?.plugins.get(plugin.name),
                getOrComputeFileData: (mixedPath, observations) => {
                  invariant(
                    dataIdx != null,
                    'metro-file-map: Plugin "%s" has no worker to process files with',
                    plugin.name
                  );
                  const result = fileSystem.lookup(mixedPath, observations);
                  if (!result.exists) {
                    return { exists: false };
                  }
                  if (result.type === 'd') {
                    return { exists: true, type: 'd' };
                  }
                  // Plugin data is derived from what the file holds, so it
                  // changes when the file is modified.
                  observations?.content.add(result.canonicalPath);
                  let data = result.metadata[dataIdx];
                  // `undefined` means no worker has run on this file.
                  if (data === undefined) {
                    if (isLazy) {
                      data = this.#fileProcessor.processFileForPlugin(
                        result.realPath,
                        result.metadata,
                        dataIdx - H.PLUGINDATA
                      );
                      debug('Lazily processed file for %s: %s', plugin.name, mixedPath);
                      // Inform caches that there is new data to save.
                      this.emit('metadata');
                    } else {
                      data = null;
                    }
                  }
                  return {
                    exists: true,
                    type: 'f',
                    realPath: result.realPath,
                    data,
                  };
                },
              });
            })
          ),
        ]);

        // The cache key does not include roots added by `addRoot`, so the
        // cache may hold files from an earlier instance's added roots. Drop
        // them, including from plugins.
        if (initialData != null) {
          for (const canonicalPath of fileSystem.pathsOutsideRoots([
            ...this.#options.roots,
            ...realRoots,
          ])) {
            fileDelta.removedFiles.add(canonicalPath);
          }
        }

        // Update `fileSystem` and plugins based on the file delta.
        const actualChanges = await this.#applyFileDelta(fileSystem, plugins, fileDelta);

        const changeSize = actualChanges.getSize();

        // Validate plugins before persisting them.
        plugins.forEach(({ plugin }) => plugin.assertValid());

        const watchmanClocks = new Map(fileDelta.clocks ?? []);
        await this.#takeSnapshotAndPersist(fileSystem, watchmanClocks, plugins, changeSize > 0);
        debug('Finished mapping files (%d changes).', changeSize);

        await this.#watch(fileSystem, watchmanClocks, plugins);
        this.#fileSystem = fileSystem;
        doneBuild('build', {
          crawler: this.#usedWatchman ? 'watchman' : 'node',
          fromCache: initialData != null,
        });
        return { fileSystem };
      })();
    }
    return this.#buildPromise.then((result) => {
      this.#startupPerfLogger?.point('build_end');
      return result;
    });
  }

  /**
   * The directories whose files this file map holds: the `roots` it was
   * constructed with, followed by any added with `addRoot`, in the order they
   * were added. The same array is returned until the roots change.
   */
  getRoots(): readonly FileMapRoot[] {
    return this.#roots;
  }

  #updateRoots(): void {
    this.#roots = [
      ...this.#roots.filter((root) => !root.dynamic),
      ...Array.from(this.#dynamicRoots.keys(), (absolutePath) => ({
        absolutePath,
        rootRelativePath: this.#pathUtils.absoluteToNormal(absolutePath),
        dynamic: true,
      })),
    ];
  }

  /**
   * Add a directory to the file map after `build()`, crawling it and (in
   * watch mode) watching it for the lifetime of this instance. Resolves once
   * its files are available, after a 'change' event for any that are new.
   *
   * A root reached through a symlink in the file map is added at the
   * symlink's target. A path through any other symlink should be given as its
   * real path.
   *
   * Added roots are not persisted: a later instance reading this one's cache
   * starts with only its own `roots`.
   */
  addRoot(root: string): Promise<void> {
    const buildPromise = this.#buildPromise;
    invariant(buildPromise != null, 'metro-file-map: addRoot() must be called after build()');
    const fileSystem = this.#fileSystem;
    if (fileSystem == null) {
      // Symlinks are resolved against the built file system.
      return buildPromise.then(() => this.addRoot(root));
    }
    // The file system holds only real paths. Crawling a root through a
    // symlink would replace that symlink with a copy of its target.
    const absoluteRoot = fileSystem.resolveSymlinks(path.resolve(root));
    const existing = this.#dynamicRoots.get(absoluteRoot);
    if (existing != null) {
      return existing;
    }
    if (this.#roots.some((r) => path.resolve(r.absolutePath) === absoluteRoot)) {
      return Promise.resolve();
    }
    // A root within an existing one has nothing of its own to crawl or watch,
    // and is ready when that root is.
    const parent = this.#roots.find((r) =>
      absoluteRoot.startsWith(path.resolve(r.absolutePath) + path.sep)
    );
    const ready: Promise<unknown> =
      parent != null
        ? (this.#dynamicRoots.get(parent.absolutePath) ?? Promise.resolve())
        : this.#crawlAndWatchRoot(absoluteRoot);
    const added = ready.then(
      () => {},
      (error) => {
        this.#dynamicRoots.delete(absoluteRoot);
        this.#updateRoots();
        throw error;
      }
    );
    this.#dynamicRoots.set(absoluteRoot, added);
    this.#updateRoots();
    return added;
  }

  async #crawlAndWatchRoot(absoluteRoot: string): Promise<void> {
    const watcher = this.#watcher;
    const fileSystem = this.#fileSystem;
    invariant(
      watcher != null && fileSystem != null,
      'Expected build() to have set #watcher and #fileSystem'
    );
    // Watch before crawling, so that a change made during the crawl is still
    // reported.
    await watcher.watchRoot(absoluteRoot);

    const crawled = this.#changeQueue.then(async () => {
      // Apply pending watcher events first, so that the crawl is compared with
      // the current file system.
      this.#flushPendingChanges?.();
      const crawlResult = await watcher.recrawl(
        this.#pathUtils.absoluteToNormal(absoluteRoot),
        fileSystem
      );
      // end() may have been called during the crawl or while applying it.
      const abortSignal = this.#crawlerAbortController.signal;
      abortSignal.throwIfAborted();
      const changeAggregator = await this.#applyFileDelta(fileSystem, this.#plugins, crawlResult);
      abortSignal.throwIfAborted();
      // NOTE(@robhogan): The root is now crawled and watched, so the on-demand filesystem no
      // longer needs to look for paths within it
      fileSystem.excludeFromFallback(absoluteRoot);
      if (changeAggregator.getSize() === 0) {
        return;
      }
      const changeEvent: ChangeEvent = {
        changes: changeAggregator.getMappedView(toPublicMetadata),
        logger: null,
        rootDir: this.#options.rootDir,
      };
      this.emit('change', changeEvent);
    });
    this.#changeQueue = crawled.catch(() => {});
    await crawled;
  }

  /**
   * 1. read data from the cache or create an empty structure.
   */
  async read(): Promise<CacheData | null | undefined> {
    let data: CacheData | null | undefined;
    this.#startupPerfLogger?.point('read_start');
    try {
      data = await this.#cacheManager.read();
    } catch (e) {
      this.#console.warn('Error while reading cache, falling back to a full crawl:\n', e);
      this.#startupPerfLogger?.annotate({
        string: { cacheReadError: (e as Error).toString() },
      });
      event('cache:read_error', { error: event.error(e as Error) });
    }
    this.#startupPerfLogger?.point('read_end');
    return data;
  }

  /**
   * 2. crawl the file system.
   */
  async #buildFileDelta(previousState: CrawlerOptions['previousState']): Promise<CrawlResult> {
    this.#startupPerfLogger?.point('buildFileDelta_start');

    const {
      computeSha1,
      enableSymlinks,
      extensions,
      ignorePattern,
      retainAllFiles,
      roots,
      rootDir,
      watch,
      watchmanDeferStates,
    } = this.#options;

    // A supplied crawler makes the Watchman capability probe - which spawns
    // watchman - pointless.
    this.#usedWatchman = this.#crawler == null && (await this.#shouldUseWatchman());
    const crawler = this.#usedWatchman ? 'watchman' : 'node';
    const full = !previousState.clocks || previousState.clocks.size === 0;
    const doneCrawl = debugEvent.span();

    this.#watcher = new Watcher({
      abortSignal: this.#crawlerAbortController.signal,
      computeSha1,
      console: this.#console,
      crawl: this.#crawler,
      enableSymlinks,
      extensions,
      healthCheckFilePrefix: this.#options.healthCheck.filePrefix,
      // TODO: Refactor out the two different ignore strategies here.
      ignoreForCrawl: (filePath) => {
        const ignoreMatched = ignorePattern?.test(filePath) === true;
        return ignoreMatched || (!retainAllFiles && filePath.includes(NODE_MODULES));
      },
      ignorePatternForWatch: ignorePattern,
      perfLogger: this.#startupPerfLogger,
      previousState,
      rootDir,
      roots,
      useWatchman: this.#usedWatchman,
      watch,
      watchmanDeferStates,
    });
    const watcher = this.#watcher;

    watcher.on('status', (status) => this.emit('status', status));

    const result = await watcher.crawl();
    this.#startupPerfLogger?.point('buildFileDelta_end');
    doneCrawl('crawl', {
      crawler,
      full,
      changed: result.changedFiles.size,
      removed: result.removedFiles.size,
    });
    return result;
  }

  #maybeReadLink(normalPath: Path, fileMetadata: FileMetadata): Promise<void> | null | undefined {
    // If we only need to read a link, it's more efficient to do it in-band
    // (with async file IO) than to have the overhead of worker IO.
    if (fileMetadata[H.SYMLINK] === 1) {
      return fsPromises
        .readlink(this.#pathUtils.normalToAbsolute(normalPath))
        .then((symlinkTarget) => {
          fileMetadata[H.VISITED] = 1;
          fileMetadata[H.SYMLINK] = normalizePathSeparatorsToPosix(
            this.#pathUtils.resolveSymlinkToNormal(normalPath, symlinkTarget)
          );
        });
    }
    return null;
  }

  async #applyFileDelta(
    fileSystem: MutableFileSystem,
    plugins: readonly IndexedPlugin[],
    delta: Readonly<{
      changedFiles: FileData;
      removedFiles: ReadonlySet<CanonicalPath>;
      clocks?: WatchmanClocks;
    }>
  ): Promise<FileSystemChangeAggregator> {
    this.#startupPerfLogger?.point('applyFileDelta_start');
    const doneProcess = debugEvent.span();
    const { changedFiles, removedFiles } = delta;
    this.#startupPerfLogger?.point('applyFileDelta_preprocess_start');
    // Remove files first so that we don't mistake moved modules
    // modules as duplicates.
    this.#startupPerfLogger?.point('applyFileDelta_remove_start');
    const changeAggregator = new FileSystemChangeAggregator();
    for (const relativeFilePath of removedFiles) {
      fileSystem.remove(relativeFilePath, changeAggregator);
    }
    this.#startupPerfLogger?.point('applyFileDelta_remove_end');

    const readLinkPromises: Promise<void>[] = [];
    const readLinkErrors: {
      normalFilePath: string;
      error: Error & { code?: string };
    }[] = [];
    const filesToProcess: [string, FileMetadata][] = [];

    for (const [normalFilePath, fileData] of changedFiles) {
      // A crawler may preserve the H.VISITED flag to indicate that the file
      // contents are unchanged and it doesn't need visiting again.
      if (fileData[H.VISITED] === 1) {
        continue;
      }

      if (fileData[H.SYMLINK] === 0) {
        filesToProcess.push([normalFilePath, fileData]);
      } else if (fileData[H.MTIME] != null && fileData[H.MTIME] !== 0) {
        // The symlink will only be updated, if it's been accessed before
        // If this is a newly crawled entry, it's skipped
        const maybeReadLink = this.#maybeReadLink(normalFilePath, fileData);
        if (maybeReadLink) {
          readLinkPromises.push(
            maybeReadLink.catch((error) => {
              readLinkErrors.push({ normalFilePath, error });
            })
          );
        }
      }
    }
    this.#startupPerfLogger?.point('applyFileDelta_preprocess_end');

    debug(
      'Found %d added/modified files and %d symlinks.',
      filesToProcess.length,
      readLinkPromises.length
    );

    this.#startupPerfLogger?.point('applyFileDelta_process_start');
    const [batchResult] = await Promise.all([
      this.#fileProcessor.processBatch(filesToProcess, {
        computeSha1: this.#options.computeSha1,
        maybeReturnContent: false,
      }),
      Promise.all(readLinkPromises),
    ]);
    this.#startupPerfLogger?.point('applyFileDelta_process_end');

    // It's possible that a file could be deleted between being seen by the
    // crawler and our attempt to process it. For our purposes, this is
    // equivalent to the file being deleted before the crawl, being absent
    // from `changedFiles`, and (if we loaded from cache, and the file
    // existed previously) possibly being reported in `removedFiles`.
    //
    // Treat the file accordingly - don't add it to `FileSystem`, and remove
    // it if it already exists. We're not emitting events at this point in
    // startup, so there's nothing more to do.
    this.#startupPerfLogger?.point('applyFileDelta_missing_start');
    for (const { normalFilePath, error } of batchResult.errors.concat(readLinkErrors)) {
      if (['ENOENT', 'EACCESS'].includes(error.code as string)) {
        delta.changedFiles.delete(normalFilePath);
        fileSystem.remove(normalFilePath, changeAggregator);
      } else {
        // Anything else is fatal.
        throw error;
      }
    }

    this.#startupPerfLogger?.point('applyFileDelta_missing_end');

    this.#startupPerfLogger?.point('applyFileDelta_add_start');
    fileSystem.bulkAddOrModify(changedFiles, changeAggregator);
    this.#startupPerfLogger?.point('applyFileDelta_add_end');

    this.#startupPerfLogger?.point('applyFileDelta_updatePlugins_start');
    this.#plugins.forEach(({ plugin, dataIdx }) => {
      plugin.onChanged(
        changeAggregator.getMappedView(
          dataIdx != null ? (metadata) => metadata[dataIdx] : () => null
        )
      );
    });
    this.#startupPerfLogger?.point('applyFileDelta_updatePlugins_end');
    this.#startupPerfLogger?.point('applyFileDelta_end');

    doneProcess('process', { processed: filesToProcess.length });
    return changeAggregator;
  }

  /**
   * 4. Serialize a snapshot of our raw data via the configured cache manager
   */
  async #takeSnapshotAndPersist(
    fileSystem: FileSystem,
    clocks: WatchmanClocks,
    plugins: readonly IndexedPlugin[],
    changedSinceCacheRead: boolean
  ) {
    this.#startupPerfLogger?.point('persist_start');
    const donePersist = debugEvent.span();
    await this.#cacheManager.write(
      () => ({
        clocks: new Map(clocks),
        fileSystemData: fileSystem.getSerializableSnapshot(),
        plugins: new Map(
          plugins.map(({ plugin }) => [plugin.name, plugin.getSerializableSnapshot()])
        ),
      }),
      {
        changedSinceCacheRead,
        eventSource: {
          onChange: (cb) => {
            // Inform the cache about changes to internal state, including:
            //  - File system changes
            this.on('change', cb);
            //  - Changes to stored metadata, e.g. on lazy processing.
            this.on('metadata', cb);
            return () => {
              this.removeListener('change', cb);
              this.removeListener('metadata', cb);
            };
          },
        },
        onWriteError: (error) => {
          this.#console.warn('[metro-file-map] Cache write error\n:', error);
        },
      }
    );
    this.#startupPerfLogger?.point('persist_end');
    donePersist('persist', {});
  }

  /**
   * Watch mode
   */
  async #watch(
    fileSystem: MutableFileSystem,
    clocks: WatchmanClocks,
    plugins: readonly IndexedPlugin[]
  ): Promise<void> {
    this.#startupPerfLogger?.point('watch_start');
    if (!this.#options.watch) {
      this.#startupPerfLogger?.point('watch_end');
      return;
    }

    const hasWatchedExtension = (filePath: string) =>
      this.#options.extensions.some((ext) => filePath.endsWith(ext));

    let nextEmit: {
      events: InternalEnqueuedEvent[];
      firstEventTimestamp: number;
      firstEnqueuedTimestamp: number;
    } | null = null;

    const emitChange = () => {
      if (nextEmit == null) {
        // Nothing to emit
        return;
      }
      const { events, firstEventTimestamp, firstEnqueuedTimestamp } = nextEmit;

      const changeAggregator = new FileSystemChangeAggregator();

      // Process a sequence of events. Note that preserving ordering is
      // important here - a file may be both removed and added in the same
      // batch.
      // `changeAggregator` flattens this over time into the net change from
      // this sequence.
      for (const event of events) {
        const { relativeFilePath, clock } = event;
        if (event.type === 'delete') {
          fileSystem.remove(relativeFilePath, changeAggregator);
        } else {
          fileSystem.addOrModify(relativeFilePath, event.metadata, changeAggregator);
        }
        this.#updateClock(clocks, clock);
      }

      const changeSize = changeAggregator.getSize();

      if (changeSize === 0) {
        // We had events, but they've exactly cancelled each other out, reset
        // so that timers are correct for the next change.
        nextEmit = null;
        return;
      }

      this.#plugins.forEach(({ plugin, dataIdx }) => {
        plugin.onChanged(
          changeAggregator.getMappedView(
            dataIdx != null ? (metadata) => metadata[dataIdx] : () => null
          )
        );
      });

      const changesWithMetadata = changeAggregator.getMappedView(toPublicMetadata);

      const hmrPerfLogger = this.#options.perfLoggerFactory?.('HMR', {
        key: this.#getNextChangeID(),
      });
      if (hmrPerfLogger != null) {
        hmrPerfLogger.start({ timestamp: firstEventTimestamp });
        hmrPerfLogger.point('waitingForChangeInterval_start', {
          timestamp: firstEnqueuedTimestamp,
        });
        hmrPerfLogger.point('waitingForChangeInterval_end');
        hmrPerfLogger.annotate({ int: { changeSize } });
        hmrPerfLogger.point('fileChange_start');
      }
      const changeEvent: ChangeEvent = {
        changes: changesWithMetadata,
        logger: hmrPerfLogger,
        rootDir: this.#options.rootDir,
      };
      this.emit('change', changeEvent);
      nextEmit = null;
    };

    const onChange = (change: WatcherBackendChangeEvent) => {
      // Recrawl events bypass normal filtering - they trigger a full subdirectory scan
      if (
        change.event !== 'recrawl' &&
        change.metadata &&
        // Ignore all directory events
        (change.metadata.type === 'd' ||
          // Ignore regular files with unwatched extensions
          (change.metadata.type === 'f' && !hasWatchedExtension(change.relativePath)) ||
          // Don't emit events relating to symlinks if enableSymlinks: false
          (!this.#options.enableSymlinks && change.metadata?.type === 'l'))
      ) {
        return;
      }

      const absoluteFilePath = path.join(
        change.root,
        normalizePathSeparatorsToSystem(change.relativePath)
      );

      // Ignore files (including symlinks) whose path matches ignorePattern
      // (we don't ignore node_modules in watch mode)
      if (this.#options.ignorePattern?.test(absoluteFilePath) === true) {
        return;
      }

      const relativeFilePath = this.#pathUtils.absoluteToNormal(absoluteFilePath);

      const onChangeStartTime = performance.timeOrigin + performance.now();

      const enqueueEvent = (event: InternalEnqueuedEvent) => {
        nextEmit ??= {
          events: [],
          firstEnqueuedTimestamp: performance.timeOrigin + performance.now(),
          firstEventTimestamp: onChangeStartTime,
        };
        nextEmit.events.push(event);
      };

      // `recrawl` events carry no metadata.
      const changeMetadata = change.event === 'recrawl' ? undefined : change.metadata;

      this.#changeQueue = this.#changeQueue
        .then(async () => {
          // If we get duplicate events for the same file, ignore them.
          if (
            nextEmit != null &&
            nextEmit.events.find(
              (event) =>
                event.type === change.event &&
                event.relativeFilePath === relativeFilePath &&
                ((!event.metadata && !changeMetadata) ||
                  (event.metadata &&
                    changeMetadata &&
                    event.metadata[H.MTIME] != null &&
                    changeMetadata.modifiedTime != null &&
                    event.metadata[H.MTIME] === changeMetadata.modifiedTime))
            )
          ) {
            return null;
          }

          // If the file was added or modified,
          // parse it and update the file map.
          if (change.event === 'touch') {
            invariant(
              change.metadata.size != null,
              'since the file exists or changed, it should have known size'
            );
            const fileMetadata: FileMetadata = [
              change.metadata.modifiedTime,
              change.metadata.size,
              0,
              null,
              change.metadata.type === 'l' ? 1 : 0,
            ];

            try {
              if (change.metadata.type === 'l') {
                await this.#maybeReadLink(relativeFilePath, fileMetadata);
              } else {
                await this.#fileProcessor.processRegularFile(relativeFilePath, fileMetadata, {
                  computeSha1: this.#options.computeSha1,
                  maybeReturnContent: false,
                });
              }
              enqueueEvent({
                clock: change.clock,
                relativeFilePath,
                metadata: fileMetadata,
                type: change.event,
              });
            } catch (e) {
              if (!['ENOENT', 'EACCESS'].includes((e as NodeJS.ErrnoException).code as string)) {
                throw e;
              }
              // Swallow ENOENT/ACCESS errors silently. Safe because either:
              // - We never knew about the file, so neither did any consumers.
              // Or,
              // - The watcher will soon (or has already) report a "delete"
              //   event for it, and we'll clean up in the usual way at that
              //   point.
            }
          } else if (change.event === 'delete') {
            enqueueEvent({
              clock: change.clock,
              relativeFilePath,
              type: 'delete',
            });
          } else if (change.event === 'recrawl') {
            // Recrawl event: flush pending changes and re-crawl the directory
            emitChange();

            // The relativePath is relative to the watcher root (change.root),
            // but we need a path relative to rootDir for the recrawl.
            const absoluteDirPath = path.join(
              change.root,
              normalizePathSeparatorsToSystem(change.relativePath)
            );
            const subpath = this.#pathUtils.absoluteToNormal(absoluteDirPath);

            // Crawl the specific subdirectory
            const watcher = this.#watcher;
            invariant(watcher != null, 'Watcher must be initialized');
            const crawlResult = await watcher.recrawl(subpath, fileSystem);

            // Skip if no changes
            if (crawlResult.changedFiles.size === 0 && crawlResult.removedFiles.size === 0) {
              return null;
            }

            // Reuse the same batch processing logic as build()
            const recrawlChangeAggregator = await this.#applyFileDelta(
              fileSystem,
              this.#plugins,
              crawlResult
            );

            // Update clock if provided
            this.#updateClock(clocks, change.clock);

            // Skip emit if no changes after processing
            if (recrawlChangeAggregator.getSize() === 0) {
              return null;
            }

            // Emit changes directly
            const changesWithMetadata = recrawlChangeAggregator.getMappedView(toPublicMetadata);

            const changeEvent: ChangeEvent = {
              changes: changesWithMetadata,
              logger: null,
              rootDir: this.#options.rootDir,
            };
            this.emit('change', changeEvent);
          } else {
            throw new Error(
              `metro-file-map: Unrecognized event type from watcher: ${(change as { event: string }).event}`
            );
          }
          return null;
        })
        .catch((error: Error) => {
          this.#console.error(`metro-file-map: watch error:\n  ${error.stack}\n`);
        });
    };

    this.#flushPendingChanges = emitChange;
    this.#changeInterval = setInterval(emitChange, CHANGE_INTERVAL);

    invariant(this.#watcher != null, 'Expected #watcher to have been initialised by build()');
    await this.#watcher.watch(onChange, clocks);

    if (this.#options.healthCheck.enabled) {
      const performHealthCheck = () => {
        if (!this.#watcher) {
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.#watcher.checkHealth(this.#options.healthCheck.timeout).then((result) => {
          this.emit('healthCheck', result);
        });
      };
      performHealthCheck();
      this.#healthCheckInterval = setInterval(
        performHealthCheck,
        this.#options.healthCheck.interval
      );
    }
    this.#startupPerfLogger?.point('watch_end');
  }

  async end(): Promise<void> {
    if (this.#changeInterval) {
      clearInterval(this.#changeInterval);
    }
    if (this.#healthCheckInterval) {
      clearInterval(this.#healthCheckInterval);
    }

    this.#crawlerAbortController.abort();

    await Promise.all([
      this.#fileProcessor.end(),
      this.#watcher?.close(),
      this.#cacheManager.end(),
    ]);
  }

  async #shouldUseWatchman(): Promise<boolean> {
    if (!this.#options.useWatchman) {
      return false;
    }
    if (!this.#canUseWatchmanPromise) {
      this.#canUseWatchmanPromise = checkWatchmanCapabilities(WATCHMAN_REQUIRED_CAPABILITIES)
        .then(({ version }) => {
          this.#startupPerfLogger?.annotate({
            string: {
              watchmanVersion: version,
            },
          });
          return true;
        })
        .catch((e) => {
          // TODO: Advise people to either install Watchman or set
          // `useWatchman: false` here?
          this.#startupPerfLogger?.annotate({
            string: {
              watchmanFailedCapabilityCheck: (e as Error | null)?.message ?? '[missing]',
            },
          });
          event('watchman:unavailable', { reason: (e as Error | null)?.message ?? '[missing]' });
          return false;
        });
    }
    return this.#canUseWatchmanPromise;
  }

  #getNextChangeID(): number {
    if (this.#changeID >= Number.MAX_SAFE_INTEGER) {
      this.#changeID = 0;
    }
    return ++this.#changeID;
  }

  #updateClock(clocks: WatchmanClocks, newClock?: ChangeEventClock | null): void {
    if (newClock == null) {
      return;
    }
    const [absoluteWatchRoot, clockSpec] = newClock;
    const relativeFsRoot = this.#pathUtils.absoluteToNormal(absoluteWatchRoot);
    clocks.set(normalizePathSeparatorsToPosix(relativeFsRoot), clockSpec);
  }

  static H: HType = H;
}

const toPublicMetadata = (metadata: Readonly<FileMetadata>): ChangedFileMetadata => ({
  isSymlink: metadata[H.SYMLINK] !== 0,
  modifiedTime: metadata[H.MTIME] ?? null,
});

// TODO: Replace with it.map() from Node 22+
const mapIterable = <T, S>(it: Iterable<T>, fn: (item: T) => S): IteratorObject<S> =>
  (function* mapped() {
    for (const item of it) {
      yield fn(item);
    }
  })();
