/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Creates a debug logger that is excluded from production bundles.
 *
 * In development, it uses the `debug` package for namespaced logging.
 *
 * In production, it returns a no-op function to avoid bundling `debug`. This is useful for SSR
 * when we bundle `expo-router/node/render.js`, and RSC when we bundle
 * `expo-router/build/rsc/middleware.js`
 */
export declare function createDebug(namespace: string): (...args: unknown[]) => void;
//# sourceMappingURL=debug.d.ts.map