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
exports.DiskCacheManager = void 0;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const timers_1 = require("timers");
const v8_1 = require("v8");
const rootRelativeCacheKeys_1 = __importDefault(require("../lib/rootRelativeCacheKeys"));
const debug = require('debug')('Metro:FileMapCache');
let DEFAULT_PREFIX = 'metro-file-map';
if (process.isBun) {
    // NOTE(@kitten): The v8 serialize/deserialize format isn't 100% compatible between
    // Node and Bun and therefore we should fork the cache file
    DEFAULT_PREFIX += '-bun';
}
const DEFAULT_DIRECTORY = (0, os_1.tmpdir)();
const DEFAULT_AUTO_SAVE_DEBOUNCE_MS = 5000;
// NOTE(@kitten): We're incompatible with Metro, so need our own naming
const FIXED_PREFIX = 'expo';
class DiskCacheManager {
    #autoSaveOpts;
    #cachePath;
    #debounceTimeout = null;
    #writePromise = Promise.resolve();
    #hasUnwrittenChanges = false;
    #tryWrite;
    #stopListening;
    constructor({ buildParameters }, { autoSave = {}, cacheDirectory, cacheFilePrefix }) {
        this.#cachePath = DiskCacheManager.getCacheFilePath(buildParameters, cacheFilePrefix, cacheDirectory);
        // Normalise auto-save options.
        if (autoSave) {
            const { debounceMs = DEFAULT_AUTO_SAVE_DEBOUNCE_MS } = autoSave === true ? {} : autoSave;
            this.#autoSaveOpts = { debounceMs };
        }
    }
    static getCacheFilePath(buildParameters, cacheFilePrefix, cacheDirectory) {
        const { rootDirHash, relativeConfigHash } = (0, rootRelativeCacheKeys_1.default)(buildParameters);
        return path_1.default.join(cacheDirectory ?? DEFAULT_DIRECTORY, `${cacheFilePrefix ?? DEFAULT_PREFIX}-${FIXED_PREFIX}-${rootDirHash}-${relativeConfigHash}`);
    }
    getCacheFilePath() {
        return this.#cachePath;
    }
    async read() {
        try {
            return (0, v8_1.deserialize)(await fs_1.promises.readFile(this.#cachePath));
        }
        catch (e) {
            if (e?.code === 'ENOENT') {
                // Cache file not found - not considered an error.
                return null;
            }
            // Rethrow anything else.
            throw e;
        }
    }
    async write(getSnapshot, { changedSinceCacheRead, eventSource, onWriteError }) {
        // Initialise a writer function using a promise queue to ensure writes are
        // sequenced.
        // eslint-disable-next-line no-multi-assign
        const tryWrite = (this.#tryWrite = () => {
            this.#writePromise = this.#writePromise
                .then(async () => {
                if (!this.#hasUnwrittenChanges) {
                    return;
                }
                const data = getSnapshot();
                this.#hasUnwrittenChanges = false;
                await fs_1.promises.writeFile(this.#cachePath, (0, v8_1.serialize)(data));
                debug('Written cache to %s', this.#cachePath);
            })
                .catch(onWriteError);
            return this.#writePromise;
        });
        // Set up auto-save on changes, if enabled.
        if (this.#autoSaveOpts) {
            const autoSave = this.#autoSaveOpts;
            this.#stopListening?.();
            this.#stopListening = eventSource.onChange(() => {
                this.#hasUnwrittenChanges = true;
                if (this.#debounceTimeout) {
                    this.#debounceTimeout.refresh();
                }
                else {
                    this.#debounceTimeout = (0, timers_1.setTimeout)(() => tryWrite(), autoSave.debounceMs).unref();
                }
            });
        }
        // Write immediately if state has changed since the cache was read.
        if (changedSinceCacheRead) {
            this.#hasUnwrittenChanges = true;
            await tryWrite();
        }
    }
    async end() {
        // Clear any timers
        if (this.#debounceTimeout) {
            (0, timers_1.clearTimeout)(this.#debounceTimeout);
        }
        // Remove event listeners
        this.#stopListening?.();
        // Flush unwritten changes to disk (no-op if no changes)
        await this.#tryWrite?.();
    }
}
exports.DiskCacheManager = DiskCacheManager;
