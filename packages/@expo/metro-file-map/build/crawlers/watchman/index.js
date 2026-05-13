"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = watchmanCrawl;
const fb_watchman_1 = __importDefault(require("fb-watchman"));
const invariant_1 = __importDefault(require("invariant"));
const path = __importStar(require("path"));
const perf_hooks_1 = require("perf_hooks");
const planQuery_1 = require("./planQuery");
const RootPathUtils_1 = require("../../lib/RootPathUtils");
const isVcsPath_1 = __importDefault(require("../../lib/isVcsPath"));
const normalizePathSeparatorsToPosix_1 = __importDefault(require("../../lib/normalizePathSeparatorsToPosix"));
const normalizePathSeparatorsToSystem_1 = __importDefault(require("../../lib/normalizePathSeparatorsToSystem"));
const WATCHMAN_WARNING_INITIAL_DELAY_MILLISECONDS = 10000;
const WATCHMAN_WARNING_INTERVAL_MILLISECONDS = 20000;
const watchmanURL = 'https://facebook.github.io/watchman/docs/troubleshooting';
function makeWatchmanError(error) {
    error.message =
        `Watchman error: ${error.message.trim()}. Make sure watchman ` +
            `is running for this project. See ${watchmanURL}.`;
    return error;
}
async function watchmanCrawl({ abortSignal, computeSha1, extensions, ignore, includeSymlinks, onStatus, perfLogger, previousState, rootDir, roots, }) {
    abortSignal?.throwIfAborted();
    const client = new fb_watchman_1.default.Client();
    const pathUtils = new RootPathUtils_1.RootPathUtils(rootDir);
    abortSignal?.addEventListener('abort', () => client.end());
    perfLogger?.point('watchmanCrawl_start');
    const newClocks = new Map();
    let clientError;
    client.on('error', (error) => {
        clientError = makeWatchmanError(error);
    });
    // TODO: Fix to use fb-watchman types
    const cmd = async (command, ...args) => {
        let didLogWatchmanWaitMessage = false;
        const startTime = perf_hooks_1.performance.now();
        const logWatchmanWaitMessage = () => {
            didLogWatchmanWaitMessage = true;
            onStatus({
                type: 'watchman_slow_command',
                timeElapsed: perf_hooks_1.performance.now() - startTime,
                command,
            });
        };
        let intervalOrTimeoutId = setTimeout(() => {
            logWatchmanWaitMessage();
            intervalOrTimeoutId = setInterval(logWatchmanWaitMessage, WATCHMAN_WARNING_INTERVAL_MILLISECONDS);
        }, WATCHMAN_WARNING_INITIAL_DELAY_MILLISECONDS);
        try {
            const response = await new Promise((resolve, reject) => {
                // NOTE: dynamic call of command
                return client.command([command, ...args], (error, result) => error ? reject(makeWatchmanError(error)) : resolve(result));
            });
            if ('warning' in response) {
                onStatus({
                    type: 'watchman_warning',
                    warning: response.warning,
                    command,
                });
            }
            return response;
        }
        finally {
            // NOTE: clearInterval / clearTimeout are interchangeable
            clearInterval(intervalOrTimeoutId);
            if (didLogWatchmanWaitMessage) {
                onStatus({
                    type: 'watchman_slow_command_complete',
                    timeElapsed: perf_hooks_1.performance.now() - startTime,
                    command,
                });
            }
        }
    };
    async function getWatchmanRoots(roots) {
        perfLogger?.point('watchmanCrawl/getWatchmanRoots_start');
        const watchmanRoots = new Map();
        await Promise.all(roots.map(async (root, index) => {
            perfLogger?.point(`watchmanCrawl/watchProject_${index}_start`);
            const response = await cmd('watch-project', root);
            perfLogger?.point(`watchmanCrawl/watchProject_${index}_end`);
            const existing = watchmanRoots.get(response.watch);
            // A root can only be filtered if it was never seen with a
            // relative_path before.
            const canBeFiltered = !existing || existing.directoryFilters.length > 0;
            if (canBeFiltered) {
                if (response.relative_path) {
                    watchmanRoots.set(response.watch, {
                        watcher: response.watcher,
                        directoryFilters: (existing?.directoryFilters || []).concat(response.relative_path),
                    });
                }
                else {
                    // Make the filter directories an empty array to signal that this
                    // root was already seen and needs to be watched for all files or
                    // directories.
                    watchmanRoots.set(response.watch, {
                        watcher: response.watcher,
                        directoryFilters: [],
                    });
                }
            }
        }));
        perfLogger?.point('watchmanCrawl/getWatchmanRoots_end');
        return watchmanRoots;
    }
    async function queryWatchmanForDirs(rootProjectDirMappings) {
        perfLogger?.point('watchmanCrawl/queryWatchmanForDirs_start');
        const results = new Map();
        let isFresh = false;
        await Promise.all(Array.from(rootProjectDirMappings).map(async ([posixSeparatedRoot, { directoryFilters, watcher }], index) => {
            // Jest is only going to store one type of clock; a string that
            // represents a local clock. However, the Watchman crawler supports
            // a second type of clock that can be written by automation outside of
            // Jest, called an "scm query", which fetches changed files based on
            // source control mergebases. The reason this is necessary is because
            // local clocks are not portable across systems, but scm queries are.
            // By using scm queries, we can create the haste map on a different
            // system and import it, transforming the clock into a local clock.
            const since = previousState.clocks.get((0, normalizePathSeparatorsToPosix_1.default)(pathUtils.absoluteToNormal((0, normalizePathSeparatorsToSystem_1.default)(posixSeparatedRoot))));
            perfLogger?.annotate({
                bool: {
                    [`watchmanCrawl/query_${index}_has_clock`]: since != null,
                },
            });
            const { query, queryGenerator } = (0, planQuery_1.planQuery)({
                since,
                extensions,
                directoryFilters,
                includeSha1: computeSha1,
                includeSymlinks,
            });
            perfLogger?.annotate({
                string: {
                    [`watchmanCrawl/query_${index}_watcher`]: watcher ?? 'unknown',
                    [`watchmanCrawl/query_${index}_generator`]: queryGenerator,
                },
            });
            perfLogger?.point(`watchmanCrawl/query_${index}_start`);
            const response = await cmd('query', posixSeparatedRoot, query);
            perfLogger?.point(`watchmanCrawl/query_${index}_end`);
            // When a source-control query is used, we ignore the "is fresh"
            // response from Watchman because it will be true despite the query
            // being incremental.
            const isSourceControlQuery = typeof since !== 'string' && since?.scm?.['mergebase-with'] != null;
            if (!isSourceControlQuery) {
                isFresh = isFresh || response.is_fresh_instance;
            }
            results.set(posixSeparatedRoot, response);
        }));
        perfLogger?.point('watchmanCrawl/queryWatchmanForDirs_end');
        return {
            isFresh,
            results,
        };
    }
    let removedFiles = new Set();
    let changedFiles = new Map();
    let results;
    let isFresh = false;
    let queryError;
    try {
        const watchmanRoots = await getWatchmanRoots(roots);
        const watchmanFileResults = await queryWatchmanForDirs(watchmanRoots);
        results = watchmanFileResults.results;
        isFresh = watchmanFileResults.isFresh;
    }
    catch (e) {
        queryError = e;
    }
    client.end();
    if (results == null) {
        if (clientError) {
            perfLogger?.annotate({
                string: {
                    'watchmanCrawl/client_error': clientError.message ?? '[message missing]',
                },
            });
        }
        if (queryError) {
            perfLogger?.annotate({
                string: {
                    'watchmanCrawl/query_error': queryError.message ?? '[message missing]',
                },
            });
        }
        perfLogger?.point('watchmanCrawl_end');
        abortSignal?.throwIfAborted();
        throw queryError ?? clientError ?? new Error('Watchman file results missing');
    }
    perfLogger?.point('watchmanCrawl/processResults_start');
    const freshFileData = new Map();
    for (const [watchRoot, response] of results) {
        const fsRoot = (0, normalizePathSeparatorsToSystem_1.default)(watchRoot);
        const relativeFsRoot = pathUtils.absoluteToNormal(fsRoot);
        newClocks.set((0, normalizePathSeparatorsToPosix_1.default)(relativeFsRoot), 
        // Ensure we persist only the local clock.
        typeof response.clock === 'string' ? response.clock : response.clock.clock);
        for (const fileData of response.files) {
            const filePath = fsRoot + path.sep + (0, normalizePathSeparatorsToSystem_1.default)(fileData.name);
            const relativeFilePath = pathUtils.absoluteToNormal(filePath);
            if (!fileData.exists) {
                if (!isFresh) {
                    removedFiles.add(relativeFilePath);
                }
                // Whether watchman can return exists: false in a fresh instance
                // response is unknown, but there's nothing we need to do in that case.
            }
            else if (!(0, isVcsPath_1.default)(fileData.name) && !ignore(filePath)) {
                const { mtime_ms, size } = fileData;
                (0, invariant_1.default)(mtime_ms != null && size != null, 'missing file data in watchman response');
                const mtime = typeof mtime_ms === 'number' ? mtime_ms : mtime_ms.toNumber();
                let sha1hex = fileData['content.sha1hex'];
                if (typeof sha1hex !== 'string' || sha1hex.length !== 40) {
                    sha1hex = undefined;
                }
                let symlinkInfo = 0;
                if (fileData.type === 'l') {
                    symlinkInfo = fileData['symlink_target'] ?? 1;
                }
                if (typeof symlinkInfo === 'string') {
                    symlinkInfo = (0, normalizePathSeparatorsToPosix_1.default)(pathUtils.resolveSymlinkToNormal(relativeFilePath, symlinkInfo));
                }
                const nextData = [mtime, size, 0, sha1hex ?? null, symlinkInfo, null];
                // If watchman is fresh, the removed files map starts with all files
                // and we remove them as we verify they still exist.
                if (isFresh) {
                    freshFileData.set(relativeFilePath, nextData);
                }
                else {
                    changedFiles.set(relativeFilePath, nextData);
                }
            }
        }
    }
    if (isFresh) {
        ({ changedFiles, removedFiles } = previousState.fileSystem.getDifference(freshFileData));
    }
    perfLogger?.point('watchmanCrawl/processResults_end');
    perfLogger?.point('watchmanCrawl_end');
    abortSignal?.throwIfAborted();
    return {
        changedFiles,
        removedFiles,
        clocks: newClocks,
    };
}
