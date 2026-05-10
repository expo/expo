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
exports.AbstractWatcher = void 0;
const events_1 = __importDefault(require("events"));
const path = __importStar(require("path"));
const isVcsPath_1 = __importDefault(require("../lib/isVcsPath"));
const common_1 = require("./common");
class AbstractWatcher {
    root;
    ignored;
    globs;
    dot;
    doIgnore;
    #emitter = new events_1.default();
    constructor(dir, opts) {
        const { ignored, globs, dot } = opts;
        this.dot = dot || false;
        this.ignored = ignored;
        this.globs = globs;
        this.doIgnore = ignored
            ? (filePath) => (0, isVcsPath_1.default)(filePath) || (0, common_1.posixPathMatchesPattern)(ignored, filePath)
            : isVcsPath_1.default;
        this.root = path.resolve(dir);
    }
    onFileEvent(listener) {
        this.#emitter.on('fileevent', listener);
        return () => {
            this.#emitter.removeListener('fileevent', listener);
        };
    }
    onError(listener) {
        this.#emitter.on('error', listener);
        return () => {
            this.#emitter.removeListener('error', listener);
        };
    }
    async startWatching() {
        // Must be implemented by subclasses
    }
    async stopWatching() {
        this.#emitter.removeAllListeners();
    }
    emitFileEvent(event) {
        this.#emitter.emit('fileevent', {
            ...event,
            root: this.root,
        });
    }
    emitError(error) {
        this.#emitter.emit('error', error);
    }
    getPauseReason() {
        return null;
    }
}
exports.AbstractWatcher = AbstractWatcher;
