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
const assert_1 = __importDefault(require("assert"));
const crypto_1 = require("crypto");
const fb_watchman_1 = __importDefault(require("fb-watchman"));
const invariant_1 = __importDefault(require("invariant"));
const AbstractWatcher_1 = require("./AbstractWatcher");
const RecrawlWarning_1 = __importDefault(require("./RecrawlWarning"));
const common = __importStar(require("./common"));
const normalizePathSeparatorsToSystem_1 = __importDefault(require("../lib/normalizePathSeparatorsToSystem"));
const debug = require('debug')('Metro:WatchmanWatcher');
const DELETE_EVENT = common.DELETE_EVENT;
const TOUCH_EVENT = common.TOUCH_EVENT;
const SUB_PREFIX = 'metro-file-map';
/**
 * Watches `dir`.
 */
class WatchmanWatcher extends AbstractWatcher_1.AbstractWatcher {
    #client;
    subscriptionName;
    #watchProjectInfo;
    #watchmanDeferStates;
    #deferringStates = null;
    constructor(dir, opts) {
        const { watchmanDeferStates, ...baseOpts } = opts;
        super(dir, baseOpts);
        this.#watchmanDeferStates = watchmanDeferStates;
        // Use a unique subscription name per process per watched directory
        const watchKey = (0, crypto_1.createHash)('md5').update(this.root).digest('hex');
        const readablePath = this.root
            .replace(/[/\\]/g, '-') // \ and / to -
            .replace(/[^\-\w]/g, ''); // Remove non-word/hyphen
        this.subscriptionName = `${SUB_PREFIX}-${process.pid}-${readablePath}-${watchKey}`;
    }
    async startWatching() {
        await new Promise((resolve, reject) => this.#init(resolve, reject));
    }
    /**
     * Run the watchman `watch` command on the root and subscribe to changes.
     */
    #init(onReady, onError) {
        if (this.#client) {
            this.#client.removeAllListeners();
        }
        const self = this;
        this.#client = new fb_watchman_1.default.Client();
        this.#client.on('error', (error) => {
            this.emitError(error);
        });
        this.#client.on('subscription', (changeEvent) => this.#handleChangeEvent(changeEvent));
        this.#client.on('end', () => {
            console.warn('[metro-file-map] Warning: Lost connection to Watchman, reconnecting..');
            self.#init(() => { }, (error) => self.emitError(error));
        });
        this.#watchProjectInfo = null;
        function getWatchRoot() {
            return self.#watchProjectInfo ? self.#watchProjectInfo.root : self.root;
        }
        function onWatchProject(error, resp) {
            if (error) {
                onError(error);
                return;
            }
            debug('Received watch-project response: %s', resp.relative_path);
            handleWarning(resp);
            // NB: Watchman outputs posix-separated paths even on Windows, convert
            // them to system-native separators.
            self.#watchProjectInfo = {
                relativePath: resp.relative_path ? (0, normalizePathSeparatorsToSystem_1.default)(resp.relative_path) : '',
                root: (0, normalizePathSeparatorsToSystem_1.default)(resp.watch),
            };
            self.#client.command(['clock', getWatchRoot()], onClock);
        }
        function onClock(error, resp) {
            if (error) {
                onError(error);
                return;
            }
            debug('Received clock response: %s', resp.clock);
            const watchProjectInfo = self.#watchProjectInfo;
            (0, invariant_1.default)(watchProjectInfo != null, 'watch-project response should have been set before clock response');
            handleWarning(resp);
            const options = {
                fields: ['name', 'exists', 'new', 'type', 'size', 'mtime_ms'],
                since: resp.clock,
                defer: self.#watchmanDeferStates,
                relative_root: watchProjectInfo.relativePath,
            };
            // Make sure we honor the dot option if even we're not using globs.
            if (self.globs.length === 0 && !self.dot) {
                options.expression = [
                    'match',
                    '**',
                    'wholename',
                    {
                        includedotfiles: false,
                    },
                ];
            }
            self.#client.command(['subscribe', getWatchRoot(), self.subscriptionName, options], onSubscribe);
        }
        const onSubscribe = (error, resp) => {
            if (error) {
                onError(error);
                return;
            }
            debug('Received subscribe response: %s', resp.subscribe);
            handleWarning(resp);
            if (resp['asserted-states'] != null) {
                this.#deferringStates = new Set(resp['asserted-states']);
            }
            onReady();
        };
        self.#client.command(['watch-project', getWatchRoot()], onWatchProject);
    }
    /**
     * Handles a change event coming from the subscription.
     */
    #handleChangeEvent(resp) {
        debug('Received subscription response: %s (fresh: %s, files: %s, enter: %s, leave: %s, clock: %s)', resp.subscription, resp.is_fresh_instance, resp.files?.length, resp['state-enter'], resp['state-leave'], resp.clock);
        assert_1.default.equal(resp.subscription, this.subscriptionName, 'Invalid subscription event.');
        if (Array.isArray(resp.files)) {
            resp.files.forEach((change) => this.#handleFileChange(change, resp.clock));
        }
        const { 'state-enter': stateEnter, 'state-leave': stateLeave } = resp;
        if (stateEnter != null && (this.#watchmanDeferStates ?? []).includes(stateEnter)) {
            this.#deferringStates?.add(stateEnter);
            debug('Watchman reports "%s" just started. Filesystem notifications are paused.', stateEnter);
        }
        if (stateLeave != null && (this.#watchmanDeferStates ?? []).includes(stateLeave)) {
            this.#deferringStates?.delete(stateLeave);
            debug('Watchman reports "%s" ended. Filesystem notifications resumed.', stateLeave);
        }
    }
    /**
     * Handles a single change event record.
     */
    #handleFileChange(changeDescriptor, rawClock) {
        const self = this;
        const watchProjectInfo = self.#watchProjectInfo;
        (0, invariant_1.default)(watchProjectInfo != null, 'watch-project response should have been set before receiving subscription events');
        const { name: relativePosixPath, new: isNew = false, exists = false, type, mtime_ms, size, } = changeDescriptor;
        // Watchman emits posix-separated paths on Windows, which is inconsistent
        // with other watchers. Normalize to system-native separators.
        const relativePath = (0, normalizePathSeparatorsToSystem_1.default)(relativePosixPath);
        debug('Handling change to: %s (new: %s, exists: %s, type: %s)', relativePath, isNew, exists, type);
        // Ignore files of an unrecognized type
        if (type != null && !(type === 'f' || type === 'd' || type === 'l')) {
            return;
        }
        if (this.doIgnore(relativePath) ||
            !common.includedByGlob(type, this.globs, this.dot, relativePath)) {
            return;
        }
        const clock = typeof rawClock === 'string' && this.#watchProjectInfo != null
            ? [this.#watchProjectInfo.root, rawClock]
            : undefined;
        if (!exists) {
            self.emitFileEvent({ event: DELETE_EVENT, clock, relativePath });
        }
        else {
            (0, invariant_1.default)(type != null && mtime_ms != null && size != null, 'Watchman file change event for "%s" missing some requested metadata. ' +
                'Got type: %s, mtime_ms: %s, size: %s', relativePath, type, mtime_ms, size);
            if (
            // Change event on dirs are mostly useless.
            !(type === 'd' && !isNew)) {
                const mtime = Number(mtime_ms);
                self.emitFileEvent({
                    event: TOUCH_EVENT,
                    clock,
                    relativePath,
                    metadata: {
                        modifiedTime: mtime !== 0 ? mtime : null,
                        size,
                        type,
                    },
                });
            }
        }
    }
    /**
     * Closes the watcher.
     */
    async stopWatching() {
        await super.stopWatching();
        if (this.#client) {
            this.#client.removeAllListeners();
            this.#client.end();
        }
        this.#deferringStates = null;
    }
    getPauseReason() {
        if (this.#deferringStates == null || this.#deferringStates.size === 0) {
            return null;
        }
        const states = [...this.#deferringStates];
        if (states.length === 1) {
            return `The watch is in the '${states[0]}' state.`;
        }
        return `The watch is in the ${states
            .slice(0, -1)
            .map((s) => `'${s}'`)
            .join(', ')} and '${states[states.length - 1]}' states.`;
    }
}
exports.default = WatchmanWatcher;
/**
 * Handles a warning in the watchman resp object.
 */
function handleWarning(resp) {
    if ('warning' in resp) {
        if (RecrawlWarning_1.default.isRecrawlWarningDupe(resp.warning)) {
            return true;
        }
        console.warn(resp.warning);
        return true;
    }
    else {
        return false;
    }
}
