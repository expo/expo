"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchThenEvalAsync = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Basically `__webpack_require__.l`.
function fetchThenEvalAsync(url, { scriptType, nonce, crossOrigin, } = {}) {
    if (typeof document === 'undefined') {
        return require('./fetchThenEvalJs').fetchThenEvalAsync(url);
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        if (scriptType)
            script.type = scriptType;
        if (nonce)
            script.setAttribute('nonce', nonce);
        // script.setAttribute('data-expo-metro', ...);
        script.src = url;
        if (crossOrigin && script.src.indexOf(window.location.origin + '/') !== 0) {
            script.crossOrigin = crossOrigin;
        }
        script.onload = () => {
            script.parentNode && script.parentNode.removeChild(script);
            resolve();
        };
        // Create a new error object to preserve the original stack trace.
        const error = new AsyncRequireError();
        // Server error or network error.
        script.onerror = (ev) => {
            let event;
            if (typeof ev === 'string') {
                event = {
                    type: 'error',
                    target: {
                        // @ts-expect-error
                        src: event,
                    },
                };
            }
            else {
                event = ev;
            }
            const errorType = event && (event.type === 'load' ? 'missing' : event.type);
            // @ts-expect-error
            const realSrc = event?.target?.src;
            error.message = 'Loading module ' + url + ' failed.\n(' + errorType + ': ' + realSrc + ')';
            error.type = errorType;
            error.request = realSrc;
            script.parentNode && script.parentNode.removeChild(script);
            reject(error);
        };
        document.head.appendChild(script);
    });
}
exports.fetchThenEvalAsync = fetchThenEvalAsync;
class AsyncRequireError extends Error {
    name = 'AsyncRequireError';
    type;
    request;
}
//# sourceMappingURL=fetchThenEval.web.js.map