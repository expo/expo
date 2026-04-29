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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const os_1 = require("os");
const path = __importStar(require("path"));
const AbstractWatcher_1 = require("./AbstractWatcher");
const common_1 = require("./common");
const debug = require('debug')('Metro:NativeWatcher');
const TOUCH_EVENT = 'touch';
const DELETE_EVENT = 'delete';
const RECRAWL_EVENT = 'recrawl';
/**
 * NativeWatcher uses Node's native fs.watch API with recursive: true.
 *
 * Supported on macOS (and potentially Windows), because both natively have a
 * concept of recurisve watching, via FSEvents and ReadDirectoryChangesW
 * respectively. Notably Linux lacks this capability at the OS level.
 *
 * Node.js has at times supported the `recursive` option to fs.watch on Linux
 * by walking the directory tree and creating a watcher on each directory, but
 * this fits poorly with the synchronous `watch` API - either it must block for
 * arbitrarily large IO, or it may drop changes after `watch` returns. See:
 * https://github.com/nodejs/node/issues/48437
 *
 * Therefore, we retain a fallback to our own application-level recursive
 * FallbackWatcher for Linux, which has async `startWatching`.
 *
 * On Windows, this watcher could be used in principle, but needs work around
 * some Windows-specific edge cases handled in FallbackWatcher, like
 * deduping file change events, ignoring directory changes, and handling EPERM.
 */
class NativeWatcher extends AbstractWatcher_1.AbstractWatcher {
    #fsWatcher;
    static isSupported() {
        return (0, os_1.platform)() === 'darwin';
    }
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(dir, opts) {
        // NOTE(@kitten): `!NativeWatcher.isSupported` was always truthy, so omitting check here
        super(dir, opts);
    }
    async startWatching() {
        this.#fsWatcher = (0, fs_1.watch)(this.root, {
            // Don't hold the process open if we forget to close()
            persistent: false,
            // FSEvents or ReadDirectoryChangesW should mean this is cheap and
            // ~instant on macOS or Windows.
            recursive: true,
        }, (event, relativePath) => {
            this._handleEvent(event, relativePath).catch((error) => {
                this.emitError(error);
            });
        });
        debug('Watching %s', this.root);
    }
    /**
     * End watching.
     */
    async stopWatching() {
        await super.stopWatching();
        if (this.#fsWatcher) {
            this.#fsWatcher.close();
        }
    }
    async _handleEvent(event, relativePath) {
        if (relativePath == null) {
            return;
        }
        const absolutePath = path.resolve(this.root, relativePath);
        if (this.doIgnore(relativePath)) {
            debug('Ignoring event "%s" on %s (root: %s)', event, relativePath, this.root);
            return;
        }
        debug('Handling event "%s" on %s (root: %s)', event, relativePath, this.root);
        try {
            const stat = await fs_1.promises.lstat(absolutePath);
            const type = (0, common_1.typeFromStat)(stat);
            // Ignore files of an unrecognized type
            if (!type) {
                return;
            }
            if (!(0, common_1.includedByGlob)(type, this.globs, this.dot, relativePath)) {
                return;
            }
            // For directory "rename" events, notify that we need a recrawl since we
            // wont' receive events for unmodified files underneath a moved (or
            // cloned) directory. Renames are fired by the OS on moves, clones, and
            // creations. We ignore "change" events because they indiciate a change
            // to directory metadata, rather than its path or existence.
            if (type === 'd' && event === 'rename') {
                debug('Directory rename detected on %s, requesting recrawl', relativePath);
                this.emitFileEvent({
                    event: RECRAWL_EVENT,
                    relativePath,
                });
                return;
            }
            this.emitFileEvent({
                event: TOUCH_EVENT,
                relativePath,
                metadata: {
                    type,
                    modifiedTime: stat.mtime.getTime(),
                    size: stat.size,
                },
            });
        }
        catch (error) {
            if (error?.code !== 'ENOENT') {
                this.emitError(error);
                return;
            }
            this.emitFileEvent({ event: DELETE_EVENT, relativePath });
        }
    }
}
exports.default = NativeWatcher;
