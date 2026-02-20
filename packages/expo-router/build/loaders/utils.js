"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoaderModulePath = getLoaderModulePath;
exports.fetchLoader = fetchLoader;
const url_1 = require("../utils/url");
/**
 * Convert a route's pathname to a loader module path.
 *
 * @example
 * getLoaderModulePath(`/`);       // `/_expo/loaders/index`
 * getLoaderModulePath(`/about`)   // `/_expo/loaders/about`
 * getLoaderModulePath(`/posts/1`) // `/_expo/loaders/posts/1`
 */
function getLoaderModulePath(routePath) {
    const { pathname, search } = (0, url_1.parseUrlUsingCustomBase)(routePath);
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    const pathSegment = normalizedPath === '/' ? '/index' : normalizedPath;
    return `/_expo/loaders${pathSegment}${search}`;
}
/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server
 * 2. Production with static files (SSG)
 * 3. SSR environments
 *
 * @see import('packages/@expo/cli/src/start/server/metro/createServerRouteMiddleware.ts').createRouteHandlerMiddleware
 * @see import('packages/expo-server/src/vendor/environment/common.ts').createEnvironment
 */
async function fetchLoader(routePath) {
    const loaderPath = getLoaderModulePath(routePath);
    const response = await fetch(loaderPath, {
        headers: {
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch loader data: ${response.status}`);
    }
    try {
        return await response.json();
    }
    catch (error) {
        throw new Error(`Failed to parse loader data: ${error}`);
    }
}
//# sourceMappingURL=utils.js.map