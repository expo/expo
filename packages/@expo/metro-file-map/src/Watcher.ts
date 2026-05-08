/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

import nodeCrawl from './crawlers/node';
import watchmanCrawl from './crawlers/watchman';
import type {
  Console,
  CrawlerOptions,
  CrawlResult,
  Path,
  PerfLogger,
  WatcherBackend,
  WatcherBackendChangeEvent,
} from './types';
import FallbackWatcher from './watchers/FallbackWatcher';
import NativeWatcher from './watchers/NativeWatcher';
import WatchmanWatcher from './watchers/WatchmanWatcher';
import { TOUCH_EVENT } from './watchers/common';
import type { WatcherOptions as WatcherBackendOptions } from './watchers/common';

const debug = require('debug')('Metro:Watcher');

const MAX_WAIT_TIME = 240000;

interface InternalCrawlOptions {
  readonly previousState: CrawlerOptions['previousState'];
  readonly roots: readonly string[];
  readonly subpath?: string;
  readonly useWatchman: boolean;
}

interface WatcherOptions {
  abortSignal: AbortSignal;
  computeSha1: boolean;
  console: Console;
  enableSymlinks: boolean;
  extensions: readonly string[];
  /** @deprecated */
  forceNodeFilesystemAPI?: boolean;
  healthCheckFilePrefix: string | null;
  ignoreForCrawl: (filePath: string) => boolean;
  ignorePatternForWatch: RegExp | null;
  previousState: CrawlerOptions['previousState'];
  perfLogger: PerfLogger | undefined | null;
  roots: readonly string[];
  rootDir: string;
  useWatchman: boolean;
  watch: boolean;
  watchmanDeferStates: readonly string[];
}

let nextInstanceId = 0;

export type HealthCheckResult =
  | { type: 'error'; timeout: number; error: Error; watcher: string | undefined | null }
  | {
      type: 'success';
      timeout: number;
      timeElapsed: number;
      watcher: string | undefined | null;
    }
  | {
      type: 'timeout';
      timeout: number;
      watcher: string | undefined | null;
      pauseReason: string | undefined | null;
    };

export class Watcher extends EventEmitter {
  #activeWatcher: string | undefined | null;
  #backends: readonly WatcherBackend[] = [];
  readonly #instanceId: number;
  #nextHealthCheckId: number = 0;
  readonly #options: WatcherOptions;
  readonly #pendingHealthChecks: Map</* basename */ string, /* resolve */ () => void> = new Map();

  constructor(options: WatcherOptions) {
    super();
    this.#options = options;
    this.#instanceId = nextInstanceId++;
  }

  async crawl(): Promise<CrawlResult> {
    this.#options.perfLogger?.point('crawl_start');
    const options = this.#options;

    const result = await this.#crawl({
      previousState: options.previousState,
      roots: options.roots,
      useWatchman: options.useWatchman,
    });

    this.#options.perfLogger?.point('crawl_end');
    return result;
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

    const ignoreForCrawl = (() => {
      if (options.ignoreForCrawl && options.healthCheckFilePrefix) {
        const baseIgnore = options.ignoreForCrawl;
        const prefix = options.healthCheckFilePrefix;
        return (filePath: string) =>
          baseIgnore(filePath) || filePath.startsWith(prefix, filePath.lastIndexOf(path.sep) + 1);
      } else if (options.ignoreForCrawl) {
        return options.ignoreForCrawl;
      } else if (options.healthCheckFilePrefix) {
        const prefix = options.healthCheckFilePrefix;
        return (filePath: string) =>
          filePath.startsWith(prefix, filePath.lastIndexOf(path.sep) + 1);
      } else {
        return () => false;
      }
    })();

    const crawl = useWatchman ? watchmanCrawl : nodeCrawl;
    let crawler = crawl === watchmanCrawl ? 'watchman' : 'node';

    options.abortSignal.throwIfAborted();

    const crawlerOptions: CrawlerOptions = {
      abortSignal: options.abortSignal,
      computeSha1: options.computeSha1,
      console: options.console,
      includeSymlinks: options.enableSymlinks,
      extensions: options.extensions,
      forceNodeFilesystemAPI: options.forceNodeFilesystemAPI,
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
    } catch (firstError: any) {
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
          firstError.toString()
      );
      try {
        delta = await nodeCrawl(crawlerOptions);
      } catch (retryError: any) {
        throw new Error(
          'Crawler retry failed:\n' +
            `  Original error: ${firstError.message}\n` +
            `  Retry error: ${retryError.message}\n`
        );
      }
    }

    debug(
      'Crawler "%s" returned %d added/modified, %d removed, %d clock(s).',
      crawler,
      delta.changedFiles.size,
      delta.removedFiles.size,
      'clocks' in delta ? (delta.clocks?.size ?? 0) : 0
    );
    return delta;
  }

  async watch(onChange: (change: WatcherBackendChangeEvent) => void) {
    const { extensions, ignorePatternForWatch, useWatchman } = this.#options;

    // WatchmanWatcher > NativeWatcher > FallbackWatcher
    const WatcherImpl = (useWatchman
      ? WatchmanWatcher
      : NativeWatcher.isSupported()
        ? NativeWatcher
        : FallbackWatcher) as unknown as new (
      root: string,
      opts: WatcherBackendOptions
    ) => WatcherBackend;

    let watcher = 'fallback';
    if (WatcherImpl === (WatchmanWatcher as unknown)) {
      watcher = 'watchman';
    } else if (WatcherImpl === (NativeWatcher as unknown)) {
      watcher = 'native';
    }
    debug(`Using watcher: ${watcher}`);
    this.#options.perfLogger?.annotate({ string: { watcher } });
    this.#activeWatcher = watcher;

    const createWatcherBackend = (root: Path): Promise<WatcherBackend> => {
      const watcherOptions: WatcherBackendOptions = {
        dot: true,
        globs: [
          // Ensure we always include package.json files, which are crucial for
          /// module resolution.
          '**/package.json',
          // Ensure we always watch any health check files
          '**/' + this.#options.healthCheckFilePrefix + '*',
          ...extensions.map((extension) => '**/*.' + extension),
        ],
        ignored: ignorePatternForWatch,
        watchmanDeferStates: this.#options.watchmanDeferStates,
      };
      const watcher: WatcherBackend = new WatcherImpl(root, watcherOptions);

      return new Promise(async (resolve, reject) => {
        const rejectTimeout = setTimeout(
          () => reject(new Error('Failed to start watch mode.')),
          MAX_WAIT_TIME
        );

        const healthCheckFilePrefix = this.#options.healthCheckFilePrefix;
        watcher.onFileEvent((change) => {
          if (healthCheckFilePrefix) {
            const isHealthCheckFile = change.relativePath.startsWith(
              healthCheckFilePrefix,
              change.relativePath.lastIndexOf(path.sep) + 1
            );
            if (isHealthCheckFile) {
              if (change.event === TOUCH_EVENT) {
                debug('Observed possible health check cookie: %s in %s', change.relativePath, root);
                this.#handleHealthCheckObservation(path.basename(change.relativePath));
              }
              return;
            }
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
          onChange(change);
        });
        await watcher.startWatching();
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    };

    this.#backends = await Promise.all(this.#options.roots.map(createWatcherBackend));
  }

  #handleHealthCheckObservation(basename: string) {
    const resolveHealthCheck = this.#pendingHealthChecks.get(basename);
    if (!resolveHealthCheck) {
      return;
    }
    resolveHealthCheck();
  }

  async close() {
    await Promise.all(this.#backends.map((watcher) => watcher.stopWatching()));
    this.#activeWatcher = null;
  }

  async checkHealth(timeout: number): Promise<HealthCheckResult> {
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
    const healthCheckPath = path.join(this.#options.rootDir, basename);
    let result: HealthCheckResult | undefined | null;
    const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, timeout)).then(() => {
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
    if (result == null) {
      throw new Error('health check result was not set by any promise branch');
    }
    return result;
  }
}
