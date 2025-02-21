"use strict";
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
asyncRequire.unstable_importWorker = function unstable_importWorker(moduleID, paths) {
    if (!paths)
        throw new Error('Bundle splitting is required for web worker imports');
    const id = paths[moduleID];
    if (!id)
        throw new Error('Worker import is missing from split bundle paths: ' + id);
    // eslint-disable-next-line valid-typeof
    if (typeof window === 'undefined') {
        return null;
    }
    return new Worker(new URL(id, window.location.href));
};
module.exports = asyncRequire;
//# sourceMappingURL=async-require.js.map