"use strict";
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUrlForBundle = void 0;
/**
 * Given a path and some optional additional query parameters, create the dev server bundle URL.
 * @param bundlePath like `/foobar`
 * @param params like `{ platform: "web" }`
 * @returns a URL like "/foobar.bundle?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null"
 */
function buildUrlForBundle(bundlePath) {
    if (bundlePath.match(/^https?:\/\//)) {
        return bundlePath;
    }
    // NOTE(EvanBacon): This must come from the window origin (at least in dev mode).
    // Otherwise Metro will crash from attempting to load a bundle that doesn't exist.
    return '/' + bundlePath.replace(/^\/+/, '');
}
exports.buildUrlForBundle = buildUrlForBundle;
//# sourceMappingURL=buildUrlForBundle.js.map