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
const path_1 = __importDefault(require("path"));
const unwrapESModule_1 = require("../../lib/unwrapESModule");
const workerExclusionList_1 = __importDefault(require("../../workerExclusionList"));
const PACKAGE_JSON = path_1.default.sep + 'package.json';
class Worker {
    #hasteImpl = null;
    constructor({ hasteImplModulePath }) {
        if (hasteImplModulePath != null) {
            this.#hasteImpl = (0, unwrapESModule_1.unwrapESModuleDefault)(require(hasteImplModulePath));
        }
    }
    async processFile(data, utils) {
        let hasteName = null;
        const { filePath } = data;
        if (filePath.endsWith(PACKAGE_JSON)) {
            // Process a package.json that is returned as a PACKAGE type with its name.
            try {
                const fileData = JSON.parse((await utils.getContent()).toString());
                if (fileData.name) {
                    hasteName = fileData.name;
                }
            }
            catch (err) {
                throw new Error(`Cannot parse ${filePath} as JSON: ${err.message}`);
            }
        }
        else if (!workerExclusionList_1.default.has(filePath.substr(filePath.lastIndexOf('.')))) {
            if (!this.#hasteImpl) {
                throw new Error('computeHaste is true but hasteImplModulePath not set');
            }
            // Process a random file that is returned as a MODULE.
            hasteName = this.#hasteImpl.getHasteName(filePath) || null;
        }
        return hasteName;
    }
}
exports.default = Worker;
