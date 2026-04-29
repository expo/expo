"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const AbstractWatcher_1 = require("./AbstractWatcher");
const common = __importStar(require("./common"));
// NOTE(@kitten): No typings
const walker = require('walker');
const platform = os_1.default.platform();
const fsPromises = fs_1.default.promises;
const TOUCH_EVENT = common.TOUCH_EVENT;
const DELETE_EVENT = common.DELETE_EVENT;
/**
 * This setting delays all events. It suppresses 'change' events that
 * immediately follow an 'add', and debounces successive 'change' events to
 * only emit the latest.
 */
const DEBOUNCE_MS = 100;
class FallbackWatcher extends AbstractWatcher_1.AbstractWatcher {
    #changeTimers = new Map();
    #dirRegistry = Object.create(null);
    #watched = Object.create(null);
    async startWatching() {
        this.#watchdir(this.root);
        await new Promise((resolve) => {
            recReaddir(this.root, (dir) => {
                this.#watchdir(dir);
            }, (filename) => {
                this.#register(filename, 'f');
            }, (symlink) => {
                this.#register(symlink, 'l');
            }, () => {
                resolve();
            }, this.#checkedEmitError, this.ignored);
        });
    }
    /**
     * Register files that matches our globs to know what to type of event to
     * emit in the future.
     *
     * Registry looks like the following:
     *
     *  dirRegister => Map {
     *    dirpath => Map {
     *       filename => true
     *    }
     *  }
     *
     *  Return false if ignored or already registered.
     */
    #register(filepath, type) {
        const dir = path_1.default.dirname(filepath);
        const filename = path_1.default.basename(filepath);
        if (this.#dirRegistry[dir] && this.#dirRegistry[dir][filename]) {
            return false;
        }
        const relativePath = path_1.default.relative(this.root, filepath);
        if (this.doIgnore(relativePath) ||
            (type === 'f' && !common.includedByGlob('f', this.globs, this.dot, relativePath))) {
            return false;
        }
        if (!this.#dirRegistry[dir]) {
            this.#dirRegistry[dir] = Object.create(null);
        }
        this.#dirRegistry[dir][filename] = true;
        return true;
    }
    /**
     * Removes a file from the registry.
     */
    #unregister(filepath) {
        const dir = path_1.default.dirname(filepath);
        if (this.#dirRegistry[dir]) {
            const filename = path_1.default.basename(filepath);
            delete this.#dirRegistry[dir][filename];
        }
    }
    /**
     * Removes a dir from the registry, returning all files that were registered
     * under it (recursively).
     */
    #unregisterDir(dirpath) {
        const removedFiles = [];
        // Find and remove all entries under this directory
        for (const registeredDir of Object.keys(this.#dirRegistry)) {
            if (registeredDir === dirpath || registeredDir.startsWith(dirpath + path_1.default.sep)) {
                // Collect all files in this directory
                for (const filename of Object.keys(this.#dirRegistry[registeredDir])) {
                    removedFiles.push(path_1.default.join(registeredDir, filename));
                }
                delete this.#dirRegistry[registeredDir];
            }
        }
        return removedFiles;
    }
    /**
     * Checks if a file or directory exists in the registry.
     */
    #registered(fullpath) {
        const dir = path_1.default.dirname(fullpath);
        return !!(this.#dirRegistry[fullpath] ||
            (this.#dirRegistry[dir] && this.#dirRegistry[dir][path_1.default.basename(fullpath)]));
    }
    /**
     * Emit "error" event if it's not an ignorable event
     */
    #checkedEmitError = (error) => {
        if (!isIgnorableFileError(error)) {
            this.emitError(error);
        }
    };
    /**
     * Watch a directory.
     */
    #watchdir = (dir) => {
        if (this.#watched[dir]) {
            return false;
        }
        const watcher = fs_1.default.watch(dir, { persistent: true }, (event, filename) => this.#normalizeChange(dir, event, filename));
        this.#watched[dir] = watcher;
        watcher.on('error', this.#checkedEmitError);
        if (this.root !== dir) {
            this.#register(dir, 'd');
        }
        return true;
    };
    /**
     * Stop watching a directory.
     */
    async #stopWatching(dir) {
        const watcher = this.#watched[dir];
        if (watcher) {
            await new Promise((resolve) => {
                watcher.once('close', () => process.nextTick(resolve));
                watcher.close();
                delete this.#watched[dir];
            });
        }
    }
    /**
     * End watching.
     */
    async stopWatching() {
        await super.stopWatching();
        const promises = Object.keys(this.#watched).map((dir) => this.#stopWatching(dir));
        await Promise.all(promises);
    }
    /**
     * On some platforms, as pointed out on the fs docs (most likely just win32)
     * the file argument might be missing from the fs event. Try to detect what
     * change by detecting if something was deleted or the most recent file change.
     */
    #detectChangedFile(dir, event, callback) {
        if (!this.#dirRegistry[dir]) {
            return;
        }
        let found = false;
        let closest = null;
        let c = 0;
        Object.keys(this.#dirRegistry[dir]).forEach((file, i, arr) => {
            fs_1.default.lstat(path_1.default.join(dir, file), (error, stat) => {
                if (found) {
                    return;
                }
                if (error) {
                    if (isIgnorableFileError(error)) {
                        found = true;
                        callback(file);
                    }
                    else {
                        this.emitError(error);
                    }
                }
                else {
                    if (closest == null || stat.mtime > closest.mtime) {
                        closest = { file, mtime: stat.mtime };
                    }
                    if (arr.length === ++c) {
                        callback(closest.file);
                    }
                }
            });
        });
    }
    /**
     * Normalize fs events and pass it on to be processed.
     */
    #normalizeChange(dir, event, file) {
        if (!file) {
            this.#detectChangedFile(dir, event, (actualFile) => {
                if (actualFile) {
                    this.#processChange(dir, event, actualFile).catch((error) => {
                        this.emitError(error);
                    });
                }
            });
        }
        else {
            this.#processChange(dir, event, path_1.default.normalize(file)).catch((error) => {
                this.emitError(error);
            });
        }
    }
    /**
     * Process changes.
     */
    async #processChange(dir, event, file) {
        const fullPath = path_1.default.join(dir, file);
        const relativePath = path_1.default.join(path_1.default.relative(this.root, dir), file);
        const registered = this.#registered(fullPath);
        try {
            const stat = await fsPromises.lstat(fullPath);
            if (stat.isDirectory()) {
                // win32 emits usless change events on dirs.
                if (event === 'change') {
                    return;
                }
                if (this.doIgnore(relativePath) ||
                    !common.includedByGlob('d', this.globs, this.dot, relativePath)) {
                    return;
                }
                recReaddir(path_1.default.resolve(this.root, relativePath), (dir, stats) => {
                    if (this.#watchdir(dir)) {
                        this.#emitEvent({
                            event: TOUCH_EVENT,
                            relativePath: path_1.default.relative(this.root, dir),
                            metadata: {
                                modifiedTime: stats.mtime.getTime(),
                                size: stats.size,
                                type: 'd',
                            },
                        });
                    }
                }, (file, stats) => {
                    if (this.#register(file, 'f')) {
                        this.#emitEvent({
                            event: TOUCH_EVENT,
                            relativePath: path_1.default.relative(this.root, file),
                            metadata: {
                                modifiedTime: stats.mtime.getTime(),
                                size: stats.size,
                                type: 'f',
                            },
                        });
                    }
                }, (symlink, stats) => {
                    if (this.#register(symlink, 'l')) {
                        this.emitFileEvent({
                            event: TOUCH_EVENT,
                            relativePath: path_1.default.relative(this.root, symlink),
                            metadata: {
                                modifiedTime: stats.mtime.getTime(),
                                size: stats.size,
                                type: 'l',
                            },
                        });
                    }
                }, function endCallback() { }, this.#checkedEmitError, this.ignored);
            }
            else {
                const type = common.typeFromStat(stat);
                if (type == null) {
                    return;
                }
                const metadata = {
                    modifiedTime: stat.mtime.getTime(),
                    size: stat.size,
                    type,
                };
                if (registered) {
                    this.#emitEvent({ event: TOUCH_EVENT, relativePath, metadata });
                }
                else {
                    if (this.#register(fullPath, type)) {
                        this.#emitEvent({ event: TOUCH_EVENT, relativePath, metadata });
                    }
                }
            }
        }
        catch (error) {
            if (!isIgnorableFileError(error)) {
                this.emitError(error);
                return;
            }
            this.#unregister(fullPath);
            // When a directory is deleted, emit delete events for all files we
            // knew about under that directory
            const removedFiles = this.#unregisterDir(fullPath);
            for (const removedFile of removedFiles) {
                this.#emitEvent({
                    event: DELETE_EVENT,
                    relativePath: path_1.default.relative(this.root, removedFile),
                });
            }
            if (registered) {
                this.#emitEvent({ event: DELETE_EVENT, relativePath });
            }
            await this.#stopWatching(fullPath);
        }
    }
    /**
     * Emits the given event after debouncing, to emit only the latest
     * information when we receive several events in quick succession. E.g.,
     * Linux emits two events for every new file.
     *
     * See also note above for DEBOUNCE_MS.
     */
    #emitEvent(change) {
        const { event, relativePath } = change;
        const key = event + '-' + relativePath;
        const existingTimer = this.#changeTimers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        this.#changeTimers.set(key, setTimeout(() => {
            this.#changeTimers.delete(key);
            this.emitFileEvent(change);
        }, DEBOUNCE_MS));
    }
    getPauseReason() {
        return null;
    }
}
exports.default = FallbackWatcher;
/**
 * Determine if a given FS error can be ignored
 */
function isIgnorableFileError(error) {
    return (error.code === 'ENOENT' ||
        // Workaround Windows EPERM on watched folder deletion, and when
        // reading locked files (pending further writes or pending deletion).
        // In such cases, we'll receive a subsequent event when the file is
        // deleted or ready to read.
        // https://github.com/facebook/metro/issues/1001
        // https://github.com/nodejs/node-v0.x-archive/issues/4337
        (error.code === 'EPERM' && platform === 'win32'));
}
/**
 * Traverse a directory recursively calling `callback` on every directory.
 */
function recReaddir(dir, dirCallback, fileCallback, symlinkCallback, endCallback, errorCallback, ignored) {
    const walk = walker(dir);
    if (ignored) {
        walk.filterDir((currentDir) => !common.posixPathMatchesPattern(ignored, currentDir));
    }
    walk
        .on('dir', normalizeProxy(dirCallback))
        .on('file', normalizeProxy(fileCallback))
        .on('symlink', normalizeProxy(symlinkCallback))
        .on('error', errorCallback)
        .on('end', () => {
        if (platform === 'win32') {
            setTimeout(endCallback, 1000);
        }
        else {
            endCallback();
        }
    });
}
/**
 * Returns a callback that when called will normalize a path and call the
 * original callback
 */
function normalizeProxy(callback) {
    return (filepath, stats) => callback(path_1.default.normalize(filepath), stats);
}
