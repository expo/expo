"use strict";
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUrlForBundle = void 0;
function buildUrlForBundle(bundlePath) {
    const getDevServer = require('../getDevServer')
        .default;
    const { url: serverUrl, bundleLoadedFromServer } = getDevServer();
    // Ensure the bundle wasn't loaded from a dev server, e.g. `npx expo start --no-dev` could trigger this while bundling in production-mode.
    if (bundleLoadedFromServer) {
        return joinComponents(serverUrl, bundlePath);
    }
    if (typeof location !== 'undefined') {
        return joinComponents(location.origin, bundlePath);
    }
    throw new Error('Unable to determine the production URL where additional JavaScript chunks are hosted because the global "location" variable is not defined.');
}
exports.buildUrlForBundle = buildUrlForBundle;
function joinComponents(prefix, suffix) {
    return prefix.replace(/\/+$/, '') + '/' + suffix.replace(/^\/+/, '');
}
//# sourceMappingURL=buildUrlForBundle.native.js.map