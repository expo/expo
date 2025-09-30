"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLoaderModule = fetchLoaderModule;
/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server (see `LoaderModuleMiddleware`)
 * 2. Production with static files (SSG)
 * 3. SSR environments
 */
async function fetchLoaderModule(routePath) {
    const loaderPath = `/_expo/loaders${routePath}`;
    // NOTE(@hassankhan): Might be a good idea to convert `loaderPath` to an `URL` object
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