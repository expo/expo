/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Ensure this is removed in production.
// TODO: Enable in production.
if (process.env.NODE_ENV !== 'production') {
    const { buildAsyncRequire } = require('./buildAsyncRequire');
    // @ts-ignore
    global[`${global.__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`] = buildAsyncRequire();
}
//# sourceMappingURL=index.native.js.map