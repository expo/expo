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
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const unwrapESModule_1 = require("./lib/unwrapESModule");
function sha1hex(content) {
    return (0, crypto_1.hash)('sha1', content, 'hex');
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
    async processFile(data) {
        let contentPromise;
        let sha1Promise;
        const { computeSha1, filePath, pluginsToRun } = data;
        const getContent = () => {
            if (contentPromise == null) {
                contentPromise = fs_1.default.promises.readFile(filePath);
            }
            return contentPromise;
        };
        const workerUtils = { getContent };
        const pluginDataPromise = Promise.all(pluginsToRun.map((pluginIdx) => this.#plugins[pluginIdx].processFile(data, workerUtils)));
        // If a SHA-1 is requested on update, compute it.
        if (computeSha1) {
            sha1Promise = getContent().then(sha1hex);
        }
        return {
            content: contentPromise != null && data.maybeReturnContent ? await contentPromise : undefined,
            pluginData: await pluginDataPromise,
            sha1: await sha1Promise,
        };
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
async function processFile(data) {
    if (!singletonWorker) {
        throw new Error('metro-file-map: setup() must be called before processFile()');
    }
    return singletonWorker.processFile(data);
}
