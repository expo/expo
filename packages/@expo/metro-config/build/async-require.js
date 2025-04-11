"use strict";
/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of https://github.com/facebook/metro/blob/b8e9e64f1de97a67234e223f5ee21524b160e8a5/packages/metro-runtime/src/modules/asyncRequire.js#L1
 * Adds worker support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function maybeLoadBundle(moduleID, paths) {
    const loadBundle = global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`];
    if (loadBundle != null) {
        const stringModuleID = String(moduleID);
        if (paths != null) {
            const bundlePath = paths[stringModuleID];
            if (bundlePath != null) {
                // NOTE: Errors will be swallowed by asyncRequire.prefetch
                return loadBundle(bundlePath);
            }
        }
    }
    return undefined;
}
function asyncRequireImpl(moduleID, paths) {
    const maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
    const importAll = () => require.importAll(moduleID);
    if (maybeLoadBundlePromise != null) {
        return maybeLoadBundlePromise.then(importAll);
    }
    return importAll();
}
async function asyncRequire(moduleID, paths, moduleName // unused
) {
    return asyncRequireImpl(moduleID, paths);
}
// Synchronous version of asyncRequire, which can still return a promise
// if the module is split.
asyncRequire.unstable_importMaybeSync = function unstable_importMaybeSync(moduleID, paths) {
    return asyncRequireImpl(moduleID, paths);
};
asyncRequire.prefetch = function (moduleID, paths, moduleName // unused
) {
    maybeLoadBundle(moduleID, paths)?.then(() => { }, () => { });
};
asyncRequire.unstable_resolve = function unstable_resolve(moduleID, paths) {
    if (!paths) {
        throw new Error('Bundle splitting is required for Web Worker imports');
    }
    const id = paths[moduleID];
    if (!id) {
        throw new Error('Worker import is missing from split bundle paths: ' + id);
    }
    return id;
};
module.exports = asyncRequire;
//# sourceMappingURL=async-require.js.map