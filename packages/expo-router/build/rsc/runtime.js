/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
globalThis.__webpack_chunk_load__ = (url) => {
    return global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`](url);
};
globalThis.__webpack_require__ = (id) => {
    return global[`${__METRO_GLOBAL_PREFIX__}__r`](id);
};
//# sourceMappingURL=runtime.js.map