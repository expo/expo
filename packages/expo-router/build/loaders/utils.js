"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoaderModulePath = getLoaderModulePath;
exports.fetchLoaderModule = fetchLoaderModule;
/**
 * Convert a route pathname to a loader module path.
 *
 * @example
 * getLoaderModulePath(`/`);       // `/_expo/loaders/index.json`
 * getLoaderModulePath(`/about`)   // `/_expo/loaders/about.json`
 * getLoaderModulePath(`/posts/1`) // `/_expo/loaders/posts/1.json`
 */
function getLoaderModulePath(pathname) {
    const cleanPath = new URL(pathname, 'http://localhost').pathname;
    const normalizedPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/$/, '');
    const pathSegment = normalizedPath === '/' ? '/index' : normalizedPath;
    return `/_expo/loaders${pathSegment}.json`;
}
/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server (see `LoaderModuleMiddleware`)
 * 2. Production with static files (SSG)
 * 3. SSR environments
 */
async function fetchLoaderModule(routePath) {
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