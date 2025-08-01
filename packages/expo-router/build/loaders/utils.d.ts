/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/**
 * Convert a route pathname to a loader module path.
 *
 * Examples:
 * - `/` becomes `/_expo/loaders/index.js`
 * - `/posts/1` becomes `/_expo/loaders/posts/1.js`
 * - `/about` becomes `/_expo/loaders/about.js`
 */
export declare function getLoaderModulePath(pathname: string): string;
/**
 * Convert a loader module path back to a route pathname.
 * This is the inverse operation of `getLoaderModulePath()`.
 *
 * Examples:
 * - `/_expo/loaders/index.js` becomes `/`
 * - `/_expo/loaders/posts/1.js` becomes `/posts/1`
 * - `/_expo/loaders/about.js` becomes `/about`
 */
export declare function getRoutePathFromLoaderPath(loaderPath: string): string;
/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server (see `LoaderModuleMiddleware`)
 * 2. Production with static files (SSG)
 * 3. SSR environments
 *
 * Optimizes for dynamic routes by detecting them upfront and loading a
 * fallback directly, avoiding unnecessary 404 requests.
 */
export declare function fetchLoaderModule(routePath: string, segments?: string[]): Promise<any>;
//# sourceMappingURL=utils.d.ts.map