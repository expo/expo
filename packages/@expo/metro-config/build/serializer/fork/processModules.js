"use strict";
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processModules = processModules;
const js_1 = require("./js");
function processModules(modules, { filter = () => true, createModuleId, dev, includeAsyncPaths, projectRoot, serverRoot, sourceUrl, splitChunks, skipWrapping, computedAsyncModulePaths, }) {
    return [...modules]
        .filter(js_1.isJsModule)
        .filter(filter)
        .map((module) => [
        module,
        (0, js_1.wrapModule)(module, {
            splitChunks,
            createModuleId,
            dev,
            includeAsyncPaths,
            projectRoot,
            serverRoot,
            sourceUrl,
            skipWrapping,
            computedAsyncModulePaths,
        }),
    ]);
}
//# sourceMappingURL=processModules.js.map