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
exports.Worker = void 0;
exports.setup = setup;
exports.processFile = processFile;
const unwrapESModule_1 = require("./lib/unwrapESModule");
const crypto_1 = require("crypto");
const graceful_fs_1 = __importDefault(require("graceful-fs"));
function sha1hex(content) {
    return (0, crypto_1.createHash)('sha1').update(content).digest('hex');
}
/**
 * Exposed for use outside a jest-worker context, ie when processing in-band.
 */
class Worker {
    #plugins;
    constructor({ plugins = [] }) {
        this.#plugins = plugins.map(({ modulePath, setupArgs }) => {
            const PluginWorker = (0, unwrapESModule_1.unwrapESModuleDefault)(require(modulePath));
            return new PluginWorker(setupArgs);
        });
    }
    processFile(data) {
        let content;
        let sha1;
        const { computeSha1, filePath, pluginsToRun } = data;
        const getContent = () => {
            if (content == null) {
                content = graceful_fs_1.default.readFileSync(filePath);
            }
            return content;
        };
        const workerUtils = { getContent };
        const pluginData = pluginsToRun.map((pluginIdx) => this.#plugins[pluginIdx].processFile(data, workerUtils));
        // If a SHA-1 is requested on update, compute it.
        if (computeSha1) {
            sha1 = sha1hex(getContent());
        }
        return content && data.maybeReturnContent
            ? { content, pluginData, sha1 }
            : { pluginData, sha1 };
    }
}
exports.Worker = Worker;
let singletonWorker;
/**
 * Called automatically by jest-worker before the first call to `worker` when
 * this module is used as worker thread or child process.
 */
function setup(args) {
    if (singletonWorker) {
        throw new Error('metro-file-map: setup() should only be called once');
    }
    singletonWorker = new Worker(args);
}
/**
 * Called by jest-worker with each workload
 */
function processFile(data) {
    if (!singletonWorker) {
        throw new Error('metro-file-map: setup() must be called before processFile()');
    }
    return singletonWorker.processFile(data);
}
