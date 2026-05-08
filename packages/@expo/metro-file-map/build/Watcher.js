"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watcher = void 0;
const events_1 = __importDefault(require("events"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const perf_hooks_1 = require("perf_hooks");
const node_1 = __importDefault(require("./crawlers/node"));
const watchman_1 = __importDefault(require("./crawlers/watchman"));
const FallbackWatcher_1 = __importDefault(require("./watchers/FallbackWatcher"));
const NativeWatcher_1 = __importDefault(require("./watchers/NativeWatcher"));
const WatchmanWatcher_1 = __importDefault(require("./watchers/WatchmanWatcher"));
const common_1 = require("./watchers/common");
const debug = require('debug')('Metro:Watcher');
const MAX_WAIT_TIME = 240000;
let nextInstanceId = 0;
class Watcher extends events_1.default {
    #activeWatcher;
    #backends = [];
    #instanceId;
    #nextHealthCheckId = 0;
    #options;
    #pendingHealthChecks = new Map();
    constructor(options) {
        super();
        this.#options = options;
        this.#instanceId = nextInstanceId++;
    }
    async crawl() {
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
    async recrawl(subpath, currentFileSystem) {
        return this.#crawl({
            previousState: {
                clocks: new Map(),
                fileSystem: currentFileSystem,
            },
            roots: [path_1.default.join(this.#options.rootDir, subpath)],
            subpath,
            useWatchman: false,
        });
    }
    async #crawl(crawlOptions) {
        const options = this.#options;
        const { useWatchman, subpath } = crawlOptions;
        const ignoreForCrawl = (() => {
            if (options.ignoreForCrawl && options.healthCheckFilePrefix) {
                const baseIgnore = options.ignoreForCrawl;
                const prefix = options.healthCheckFilePrefix;
                return (filePath) => baseIgnore(filePath) || filePath.startsWith(prefix, filePath.lastIndexOf(path_1.default.sep) + 1);
            }
            else if (options.ignoreForCrawl) {
                return options.ignoreForCrawl;
            }
            else if (options.healthCheckFilePrefix) {
                const prefix = options.healthCheckFilePrefix;
                return (filePath) => filePath.startsWith(prefix, filePath.lastIndexOf(path_1.default.sep) + 1);
            }
            else {
                return () => false;
            }
        })();
        const crawl = useWatchman ? watchman_1.default : node_1.default;
        let crawler = crawl === watchman_1.default ? 'watchman' : 'node';
        options.abortSignal.throwIfAborted();
        const crawlerOptions = {
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
        let delta;
        try {
            delta = await crawl(crawlerOptions);
        }
        catch (firstError) {
            if (crawl !== watchman_1.default) {
                throw firstError;
            }
            crawler = 'node';
            options.console.warn('metro-file-map: Watchman crawl failed. Retrying once with node ' +
                'crawler.\n' +
                "  Usually this happens when watchman isn't running. Create an " +
                "empty `.watchmanconfig` file in your project's root folder or " +
                'initialize a git or hg repository in your project.\n' +
                '  ' +
                firstError.toString());
            try {
                delta = await (0, node_1.default)(crawlerOptions);
            }
            catch (retryError) {
                throw new Error('Crawler retry failed:\n' +
                    `  Original error: ${firstError.message}\n` +
                    `  Retry error: ${retryError.message}\n`);
            }
        }
        debug('Crawler "%s" returned %d added/modified, %d removed, %d clock(s).', crawler, delta.changedFiles.size, delta.removedFiles.size, 'clocks' in delta ? (delta.clocks?.size ?? 0) : 0);
        return delta;
    }
    async watch(onChange) {
        const { extensions, ignorePatternForWatch, useWatchman } = this.#options;
        // WatchmanWatcher > NativeWatcher > FallbackWatcher
        const WatcherImpl = (useWatchman
            ? WatchmanWatcher_1.default
            : NativeWatcher_1.default.isSupported()
                ? NativeWatcher_1.default
                : FallbackWatcher_1.default);
        let watcher = 'fallback';
        if (WatcherImpl === WatchmanWatcher_1.default) {
            watcher = 'watchman';
        }
        else if (WatcherImpl === NativeWatcher_1.default) {
            watcher = 'native';
        }
        debug(`Using watcher: ${watcher}`);
        this.#options.perfLogger?.annotate({ string: { watcher } });
        this.#activeWatcher = watcher;
        const createWatcherBackend = (root) => {
            const watcherOptions = {
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
            const watcher = new WatcherImpl(root, watcherOptions);
            return new Promise(async (resolve, reject) => {
                const rejectTimeout = setTimeout(() => reject(new Error('Failed to start watch mode.')), MAX_WAIT_TIME);
                const healthCheckFilePrefix = this.#options.healthCheckFilePrefix;
                watcher.onFileEvent((change) => {
                    if (healthCheckFilePrefix) {
                        const isHealthCheckFile = change.relativePath.startsWith(healthCheckFilePrefix, change.relativePath.lastIndexOf(path_1.default.sep) + 1);
                        if (isHealthCheckFile) {
                            if (change.event === common_1.TOUCH_EVENT) {
                                debug('Observed possible health check cookie: %s in %s', change.relativePath, root);
                                this.#handleHealthCheckObservation(path_1.default.basename(change.relativePath));
                            }
                            return;
                        }
                    }
                    // Watchman handles recrawls internally - receiving a recrawl event
                    // when using Watchman would indicate a bug. Log an error and ignore.
                    if (change.event === 'recrawl' && useWatchman) {
                        this.#options.console.error('metro-file-map: Received unexpected recrawl event while using ' +
                            'Watchman. Watchman recrawls are not implemented.');
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
    #handleHealthCheckObservation(basename) {
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
    async checkHealth(timeout) {
        const healthCheckId = this.#nextHealthCheckId++;
        if (healthCheckId === Number.MAX_SAFE_INTEGER) {
            this.#nextHealthCheckId = 0;
        }
        const watcher = this.#activeWatcher;
        const basename = this.#options.healthCheckFilePrefix +
            '-' +
            process.pid +
            '-' +
            this.#instanceId +
            '-' +
            healthCheckId;
        const healthCheckPath = path_1.default.join(this.#options.rootDir, basename);
        let result;
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
        const startTime = perf_hooks_1.performance.now();
        debug('Creating health check cookie: %s', healthCheckPath);
        const creationPromise = fs_1.default.promises
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
        const observationPromise = new Promise((resolve) => {
            this.#pendingHealthChecks.set(basename, resolve);
        }).then(() => {
            if (!result) {
                result = {
                    type: 'success',
                    timeElapsed: perf_hooks_1.performance.now() - startTime,
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
        creationPromise.then(() => fs_1.default.promises.unlink(healthCheckPath).catch(() => { }));
        debug('Health check result: %o', result);
        if (result == null) {
            throw new Error('health check result was not set by any promise branch');
        }
        return result;
    }
}
exports.Watcher = Watcher;
