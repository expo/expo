/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import debugModule from 'debug';
import EventEmitter from 'events';
import * as fs from 'fs';
import nullthrows from 'nullthrows';
import * as path from 'path';
import { performance } from 'perf_hooks';

import nodeCrawl from './crawlers/node';
import watchmanCrawl from './crawlers/watchman';
import { RootPathUtils } from './lib/RootPathUtils';
import normalizePathSeparatorsToPosix from './lib/normalizePathSeparatorsToPosix';
import normalizePathSeparatorsToSystem from './lib/normalizePathSeparatorsToSystem';
import type {
  Console,
  Crawler,
  CrawlerOptions,
  CrawlResult,
  Path,
  PerfLogger,
  WatcherBackend,
  WatcherBackendChangeEvent,
  WatchmanClocks,
  WatchmanClockSpec,
} from './types';
import FallbackWatcher from './watchers/FallbackWatcher';
import NativeWatcher from './watchers/NativeWatcher';
import WatchmanWatcher from './watchers/WatchmanWatcher';
import { TOUCH_EVENT } from './watchers/common';
import type { WatcherOptions as WatcherBackendOptions } from './watchers/common';

const debug = debugModule('Metro:Watcher');

const MAX_WAIT_TIME = 240000;

// For a backend that isn't live as soon as it starts, how long to wait for each
// health check that confirms a watch, and for the watch overall.
const LIVE_CHECK_TIMEOUT = 200;
const MAX_LIVE_WAIT_TIME = 10000;

type InternalCrawlOptions = Readonly<{
  previousState: CrawlerOptions['previousState'];
  roots: readonly string[];
  subpath?: string;
  useWatchman: boolean;
}>;

type WatcherOptions = {
  abortSignal: AbortSignal;
  computeSha1: boolean;
  console: Console;
  /**
   * Replaces the built-in Watchman/node crawlers for all crawling, including
   * the scoped re-crawl issued on a directory-rename event in watch mode -
   * which passes `subpath` and narrowed `roots` that the crawler is expected to
   * honour, exactly as the built-ins do.
   *
   * Watching itself is unaffected: change events still come from the built-in
   * watcher backends.
   */
  crawl?: Crawler | null | undefined;
  enableSymlinks: boolean;
  extensions: readonly string[];
  healthCheckFilePrefix: string;
  ignoreForCrawl: (filePath: string) => boolean;
  ignorePatternForWatch: RegExp;
  previousState: CrawlerOptions['previousState'];
  perfLogger: PerfLogger | null | undefined;
  roots: readonly string[];
  rootDir: string;
  useWatchman: boolean;
  watch: boolean;
  watchmanDeferStates: readonly string[];
};

let nextInstanceId = 0;

export type HealthCheckResult =
  | { type: 'error'; timeout: number; error: Error; watcher: string | null | undefined }
  | {
      type: 'success';
      timeout: number;
      timeElapsed: number;
      watcher: string | null | undefined;
    }
  | {
      type: 'timeout';
      timeout: number;
      watcher: string | null | undefined;
      pauseReason: string | null | undefined;
    };

export class Watcher extends EventEmitter {
  #activeWatcher: string | null | undefined;
  #backends: WatcherBackend[] = [];
  // Events received by started backends before watch() is called, to be
  // replayed once it is.
  #bufferedEvents: WatcherBackendChangeEvent[] = [];
  #closed: boolean = false;
  #createBackend: ((root: Path) => Promise<WatcherBackend>) | null | undefined;
  // Whether a started backend's watches need confirming before they are
  // relied on.
  #confirmWatches: boolean = false;
  readonly #instanceId: number;
  #nextHealthCheckId: number = 0;
  #onChange: ((change: WatcherBackendChangeEvent) => void) | null | undefined;
  readonly #options: WatcherOptions;
  readonly #pendingHealthChecks: Map</* basename */ string, /* resolve */ () => void> = new Map();
  // Whether watch() uses a Watchman backend. False if the Watchman crawl fell
  // back to the node crawler, which returns no clock to subscribe `since`.
  #useWatchmanWatcher: boolean;

  constructor(options: WatcherOptions) {
    super();
    this.#options = options;
    this.#instanceId = nextInstanceId++;
    this.#useWatchmanWatcher = options.useWatchman;
  }

  async crawl(): Promise<CrawlResult> {
    this.#options.perfLogger?.point('crawl_start');
    const options = this.#options;

    // Non-Watchman backends have no clock to subscribe `since`, so they must
    // already be watching before the crawl begins, and their events buffered,
    // for changes made while crawling not to be missed. Watchman backends are
    // started by watch(), which subscribes `since` the crawl's clock to cover
    // the same window. If the Watchman crawl falls back to the node crawler,
    // there is no clock, so #crawl() starts non-Watchman backends before the
    // node crawl instead.
    if (!options.useWatchman) {
      await this.#startBackendsBeforeCrawl();
    }

    const result = await this.#crawl({
      previousState: options.previousState,
      roots: options.roots,
      useWatchman: options.useWatchman,
    });

    this.#options.perfLogger?.point('crawl_end');
    return result;
  }

  async #startBackendsBeforeCrawl(): Promise<void> {
    if (!this.#options.watch) {
      return;
    }
    await this.#startBackends();
    // end() may have closed us before the backends were set - don't leak them.
    if (this.#options.abortSignal.aborted) {
      await this.close();
    }
  }

  async recrawl(
    subpath: string,
    currentFileSystem: CrawlerOptions['previousState']['fileSystem']
  ): Promise<CrawlResult> {
    return this.#crawl({
      previousState: {
        clocks: new Map(),
        fileSystem: currentFileSystem,
      },
      roots: [path.join(this.#options.rootDir, subpath)],
      subpath,
      useWatchman: false,
    });
  }

  async #crawl(crawlOptions: InternalCrawlOptions): Promise<CrawlResult> {
    const options = this.#options;
    const { useWatchman, subpath } = crawlOptions;

    const ignoreForCrawl = (filePath: string) =>
      options.ignoreForCrawl(filePath) ||
      path.basename(filePath).startsWith(this.#options.healthCheckFilePrefix);
    // A supplied crawler is, by construction, not `watchmanCrawl`, so it takes
    // the unwrapped branch below: no node-crawler fallback, failures propagate.
    const crawl = options.crawl ?? (useWatchman ? watchmanCrawl : nodeCrawl);
    let crawler = crawl === watchmanCrawl ? 'watchman' : 'node';
    if (options.crawl != null) {
      crawler = 'custom';
    }

    options.abortSignal.throwIfAborted();

    const crawlerOptions: CrawlerOptions = {
      abortSignal: options.abortSignal,
      computeSha1: options.computeSha1,
      console: options.console,
      includeSymlinks: options.enableSymlinks,
      extensions: options.extensions,
      ignore: ignoreForCrawl,
      onStatus: (status) => {
        this.emit('status', status);
      },
      perfLogger: options.perfLogger,
      previousState: crawlOptions.previousState,
      rootDir: options.rootDir,
      roots: crawlOptions.roots,
      subpath,
    };

    debug('Crawling roots: %s with %s crawler.', crawlOptions.roots, crawler);

    let delta: CrawlResult;
    try {
      delta = await crawl(crawlerOptions);
    } catch (firstError) {
      if (crawl !== watchmanCrawl) {
        throw firstError;
      }
      crawler = 'node';
      options.console.warn(
        'metro-file-map: Watchman crawl failed. Retrying once with node ' +
          'crawler.\n' +
          "  Usually this happens when watchman isn't running. Create an " +
          "empty `.watchmanconfig` file in your project's root folder or " +
          'initialize a git or hg repository in your project.\n' +
          '  ' +
          (firstError as Error).toString()
      );
      // Watch with a non-Watchman backend, started before the node crawl so
      // that changes made during it are not missed.
      this.#useWatchmanWatcher = false;
      await this.#startBackendsBeforeCrawl();
      try {
        delta = await nodeCrawl(crawlerOptions);
      } catch (retryError) {
        throw new Error(
          'Crawler retry failed:\n' +
            `  Original error: ${(firstError as Error).message}\n` +
            `  Retry error: ${(retryError as Error).message}\n`
        );
      }
    }

    debug(
      'Crawler "%s" returned %d added/modified, %d removed, %d clock(s).',
      crawler,
      delta.changedFiles.size,
      delta.removedFiles.size,
      delta.clocks?.size ?? 0
    );
    return delta;
  }

  async watch(
    onChange: (change: WatcherBackendChangeEvent) => void,
    clocks?: WatchmanClocks
  ): Promise<void> {
    this.#onChange = onChange;

    // Replay anything a backend started before the crawl reported in the
    // meantime - these are handled exactly like live events.
    const bufferedEvents = this.#bufferedEvents;
    this.#bufferedEvents = [];
    for (const event of bufferedEvents) {
      onChange(event);
    }

    if (this.#backends.length === 0) {
      await this.#startBackends(clocks);
    }
  }

  async #startBackends(clocks?: WatchmanClocks): Promise<void> {
    const { extensions, ignorePatternForWatch } = this.#options;
    const useWatchman = this.#useWatchmanWatcher;

    // WatchmanWatcher > NativeWatcher > FallbackWatcher
    const WatcherImpl = useWatchman
      ? WatchmanWatcher
      : NativeWatcher.isSupported()
        ? NativeWatcher
        : FallbackWatcher;

    let watcher = 'fallback';
    if (WatcherImpl === WatchmanWatcher) {
      watcher = 'watchman';
    } else if (WatcherImpl === NativeWatcher) {
      watcher = 'native';
    }
    debug(`Using watcher: ${watcher}`);
    this.#options.perfLogger?.annotate({ string: { watcher } });
    this.#activeWatcher = watcher;

    // Crawl clocks are keyed by path relative to the project root, but a
    // backend only learns its Watchman watch root after `watch-project`, so
    // hand each the whole map keyed by absolute watch root to look up.
    let watchmanClocks: Map<string, WatchmanClockSpec> | null | undefined;
    if (useWatchman && clocks != null) {
      const pathUtils = new RootPathUtils(this.#options.rootDir);
      watchmanClocks = new Map(
        [...clocks].map(([root, clockSpec]) => [
          normalizePathSeparatorsToPosix(
            pathUtils.normalToAbsolute(normalizePathSeparatorsToSystem(root))
          ),
          clockSpec,
        ])
      );
    }

    const createWatcherBackend = (
      root: Path,
      rootClocks: Map<string, WatchmanClockSpec> | null | undefined
    ): Promise<WatcherBackend> => {
      const watcherOptions: WatcherBackendOptions = {
        included: {
          extensions: new Set(extensions),
          // Ensure we always include package.json files, which are crucial for
          // module resolution.
          basenames: new Set(['package.json']),
          // Ensure we always watch any health check files
          basenamePrefixes: [this.#options.healthCheckFilePrefix],
        },
        ignored: ignorePatternForWatch,
        watchmanDeferStates: this.#options.watchmanDeferStates,
        clocks: rootClocks,
      };
      const watcher: WatcherBackend = new WatcherImpl(root, watcherOptions);

      return new Promise(async (resolve, reject) => {
        const rejectTimeout = setTimeout(
          () => reject(new Error('Failed to start watch mode.')),
          MAX_WAIT_TIME
        );

        watcher.onFileEvent((change) => {
          const basename = path.basename(change.relativePath);
          if (basename.startsWith(this.#options.healthCheckFilePrefix)) {
            if (change.event === TOUCH_EVENT) {
              debug('Observed possible health check cookie: %s in %s', change.relativePath, root);
              this.#handleHealthCheckObservation(basename);
            }
            return;
          }
          // Watchman handles recrawls internally - receiving a recrawl event
          // when using Watchman would indicate a bug. Log an error and ignore.
          if (change.event === 'recrawl' && useWatchman) {
            this.#options.console.error(
              'metro-file-map: Received unexpected recrawl event while using ' +
                'Watchman. Watchman recrawls are not implemented.'
            );
            return;
          }
          const onChange = this.#onChange;
          if (onChange != null) {
            onChange(change);
          } else {
            this.#bufferedEvents.push(change);
          }
        });
        await watcher.startWatching();
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    };

    // A root added by watchRoot() is watched before it is crawled, so it
    // needs no crawl clock.
    this.#createBackend = (root) => createWatcherBackend(root, null);
    this.#backends = await Promise.all(
      this.#options.roots.map((root) => createWatcherBackend(root, watchmanClocks))
    );
    // Confirmed only once every backend has started, because starting one may
    // restart the others' watches (NativeWatchers share one FSEvents stream).
    this.#confirmWatches = !WatcherImpl.isLiveOnStart();
    if (this.#confirmWatches) {
      await Promise.all(this.#options.roots.map((root) => this.#waitUntilLive(root)));
    }
  }

  /**
   * Check the health of a root's watch until it reports a change, so that
   * changes made from now on aren't missed. Warns if it can't be confirmed.
   */
  async #waitUntilLive(root: Path): Promise<void> {
    const deadline = Date.now() + MAX_LIVE_WAIT_TIME;
    let result;
    do {
      result = await this.#checkHealth(root, LIVE_CHECK_TIMEOUT);
    } while (
      result.type === 'timeout' &&
      Date.now() < deadline &&
      !this.#closed &&
      !this.#options.abortSignal.aborted
    );
    debug('Confirming the watch of %s: %s', root, result.type);
    if (result.type !== 'success' && !this.#closed && !this.#options.abortSignal.aborted) {
      this.#options.console.warn(
        `metro-file-map: Could not confirm that ${root} is being watched ` +
          `(${result.type}). Changes made during startup may be missed.`
      );
    }
  }

  /**
   * Watch a root in addition to those given at construction, reporting its
   * changes to the `onChange` passed to `watch()`. Does nothing outside watch
   * mode, i.e. before the backends for the initial roots have started.
   */
  async watchRoot(root: Path): Promise<void> {
    const backend = await this.#createBackend?.(root);
    if (backend == null) {
      return;
    }
    // `close()` may have been called while the backend was starting.
    if (this.#closed) {
      await backend.stopWatching();
      return;
    }
    this.#backends.push(backend);
    if (this.#confirmWatches) {
      await this.#waitUntilLive(root);
    }
  }

  #handleHealthCheckObservation(basename: string) {
    const resolveHealthCheck = this.#pendingHealthChecks.get(basename);
    if (!resolveHealthCheck) {
      return;
    }
    resolveHealthCheck();
  }

  async close() {
    this.#closed = true;
    await Promise.all(this.#backends.map((watcher) => watcher.stopWatching()));
    this.#activeWatcher = null;
  }

  async checkHealth(timeout: number): Promise<HealthCheckResult> {
    return this.#checkHealth(this.#options.rootDir, timeout);
  }

  /**
   * Write a health check file into `dir`, and wait for a backend to report it.
   */
  async #checkHealth(dir: Path, timeout: number): Promise<HealthCheckResult> {
    const healthCheckId = this.#nextHealthCheckId++;
    if (healthCheckId === Number.MAX_SAFE_INTEGER) {
      this.#nextHealthCheckId = 0;
    }
    const watcher = this.#activeWatcher;
    const basename =
      this.#options.healthCheckFilePrefix +
      '-' +
      process.pid +
      '-' +
      this.#instanceId +
      '-' +
      healthCheckId;
    const healthCheckPath = path.join(dir, basename);
    let result: HealthCheckResult | null | undefined;
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeout)).then(() => {
      if (!result) {
        result = {
          type: 'timeout',
          pauseReason: this.#backends[0]?.getPauseReason(),
          timeout,
          watcher,
        };
      }
    });
    const startTime = performance.now();
    debug('Creating health check cookie: %s', healthCheckPath);
    const creationPromise = fs.promises
      .writeFile(healthCheckPath, String(startTime))
      .catch((error) => {
        if (!result) {
          result = {
            type: 'error',
            error,
            timeout,
            watcher,
          };
        }
      });
    const observationPromise = new Promise<void>((resolve) => {
      this.#pendingHealthChecks.set(basename, resolve);
    }).then(() => {
      if (!result) {
        result = {
          type: 'success',
          timeElapsed: performance.now() - startTime,
          timeout,
          watcher,
        };
      }
    });
    await Promise.race([timeoutPromise, creationPromise.then(() => observationPromise)]);
    this.#pendingHealthChecks.delete(basename);
    // Chain a deletion to the creation promise (which may not have even settled yet!),
    // don't await it, and swallow errors. This is just best-effort cleanup.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    creationPromise.then(() => fs.promises.unlink(healthCheckPath).catch(() => {}));
    debug('Health check result: %o', result);
    return nullthrows(result);
  }
}
