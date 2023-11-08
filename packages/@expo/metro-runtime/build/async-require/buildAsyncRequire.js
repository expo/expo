"use strict";
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAsyncRequire = void 0;
const loadBundle_1 = require("./loadBundle");
/** Create an `loadBundleAsync` function in the expected shape for Metro bundler. */
function buildAsyncRequire() {
    const cache = new Map();
    return async function universal_loadBundleAsync(path) {
        if (cache.has(path)) {
            return cache.get(path);
        }
        const promise = (0, loadBundle_1.loadBundleAsync)(path).catch((error) => {
            cache.delete(path);
            throw error;
        });
        cache.set(path, promise);
        return promise;
    };
}
exports.buildAsyncRequire = buildAsyncRequire;
//# sourceMappingURL=buildAsyncRequire.js.map