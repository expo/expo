"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchFetch = exports.patchErrorBox = exports.ReactServerError = exports.MetroServerError = exports.NetworkError = void 0;
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class NetworkError extends Error {
    url;
    code = 'NETWORK_ERROR';
    constructor(message, url) {
        super(message);
        this.url = url;
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class MetroServerError extends Error {
    url;
    code = 'METRO_SERVER_ERROR';
    constructor(errorObject, url) {
        super(errorObject.message);
        this.url = url;
        this.name = 'MetroServerError';
        for (const key in errorObject) {
            this[key] = errorObject[key];
        }
    }
}
exports.MetroServerError = MetroServerError;
class ReactServerError extends Error {
    url;
    statusCode;
    code = 'REACT_SERVER_ERROR';
    constructor(message, url, statusCode) {
        super(message);
        this.url = url;
        this.statusCode = statusCode;
        this.name = 'ReactServerError';
    }
}
exports.ReactServerError = ReactServerError;
function patchErrorBox() {
    if (typeof ErrorUtils === 'undefined') {
        return;
    }
    //// This appears to never be called. Mostly LogBox is presented from an invasive patch on console.error.
    const globalHandler = ErrorUtils.getGlobalHandler();
    if (globalHandler?.__router_errors_patched) {
        return;
    }
    const routerHandler = (error) => {
        if (error instanceof NetworkError ||
            error instanceof MetroServerError ||
            error instanceof ReactServerError) {
            // Use root error boundary.
            return;
        }
        globalHandler?.(error);
    };
    routerHandler.__router_errors_patched = true;
    ErrorUtils.setGlobalHandler(routerHandler);
}
exports.patchErrorBox = patchErrorBox;
// Add error handling that is used in the ErrorBoundary
function patchFetch() {
    patchErrorBox();
    // @ts-expect-error
    if (globalThis.fetch.__router_errors_patched) {
        return;
    }
    const originalFetch = globalThis.fetch;
    Object.defineProperty(global, 'fetch', {
        // value: fetch,
        value: async function fetch(input, init) {
            //   throw new NetworkError('test error', input as string);
            try {
                return await originalFetch(input, init);
            }
            catch (error) {
                const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
                if (error instanceof Error) {
                    // Based on community fetch polyfill error message.
                    if (error.message.match(/Network request failed: (The network connection was lost|Could not connect to the server)/)) {
                        throw new NetworkError(error.message, url);
                    }
                }
                throw error;
            }
        },
    });
    // @ts-expect-error
    globalThis.fetch.__router_errors_patched = true;
}
exports.patchFetch = patchFetch;
//# sourceMappingURL=patchFetch.js.map