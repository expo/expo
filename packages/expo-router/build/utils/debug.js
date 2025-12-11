"use strict";
/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDebug = createDebug;
/**
 * Creates a debug logger that is excluded from production bundles.
 *
 * In development, it uses the `debug` package for namespaced logging.
 *
 * In production, it returns a no-op function to avoid bundling `debug`. This is useful for SSR
 * when we bundle `expo-router/node/render.js`, and RSC when we bundle
 * `expo-router/build/rsc/middleware.js`
 */
function createDebug(namespace) {
    if (__DEV__) {
        return require('debug')(namespace);
    }
    return () => { };
}
//# sourceMappingURL=debug.js.map