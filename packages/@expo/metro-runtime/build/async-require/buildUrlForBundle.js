"use strict";
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUrlForBundle = void 0;
/** Given a path encodes the pathname part to be a safe URI.
 *
 * @remarks
 * On file services, especially S3, special characters in the pathname
 * part must be encoded to be recognized properly.
 * We list a regular expression with the specifically problematic
 * characters manually to be encoded here.
 */
function encodeBundlePath(filename) {
    if (typeof window === 'undefined') {
        return encodeURI(filename);
    }
    const encode = (pathname) => pathname.replace(/[+!"#$&'()*+,:;=?@]/g, (match) => `%${match.charCodeAt(0).toString(16)}`);
    if (filename.match(/^https?:\/\//)) {
        const url = new URL(filename, window.location.origin);
        url.pathname = encode(url.pathname);
        return url.toString();
    }
    else {
        const [pathname, query] = filename.split('?');
        return query ? `${encode(pathname)}?${query}` : encode(pathname);
    }
}
/**
 * Given a path and some optional additional query parameters, create the dev server bundle URL.
 * @param bundlePath like `/foobar`
 * @param params like `{ platform: "web" }`
 * @returns a URL like "/foobar.bundle?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null"
 */
function buildUrlForBundle(bundlePath) {
    if (bundlePath.match(/^https?:\/\//)) {
        return encodeBundlePath(bundlePath);
    }
    // NOTE(EvanBacon): This must come from the window origin (at least in dev mode).
    // Otherwise Metro will crash from attempting to load a bundle that doesn't exist.
    return encodeBundlePath('/' + bundlePath.replace(/^\/+/, ''));
}
exports.buildUrlForBundle = buildUrlForBundle;
//# sourceMappingURL=buildUrlForBundle.js.map