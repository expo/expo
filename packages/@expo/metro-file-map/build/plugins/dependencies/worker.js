/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const dependencyExtractor_1 = require("./dependencyExtractor");
class DependencyExtractorWorker {
    #dependencyExtractor;
    constructor({ dependencyExtractor }) {
        if (dependencyExtractor != null) {
            const mod = require(dependencyExtractor);
            this.#dependencyExtractor = mod.__esModule === true && 'default' in mod ? mod.default : mod;
        }
    }
    async processFile(data, utils) {
        const content = (await utils.getContent()).toString();
        const { filePath } = data;
        const dependencies = this.#dependencyExtractor != null
            ? this.#dependencyExtractor.extract(content, filePath, dependencyExtractor_1.extract)
            : (0, dependencyExtractor_1.extract)(content);
        // Return as array (PerFileData type)
        return Array.from(dependencies);
    }
}
exports.default = DependencyExtractorWorker;
