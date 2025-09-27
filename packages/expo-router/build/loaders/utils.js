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
    const loaderPath = `/_expo/loaders${routePath}.js`;
    // NOTE(@hassankhan): Might be a good idea to convert `loaderPath` to an `URL` object
    const response = await fetch(loaderPath);
    if (!response.ok) {
        throw new Error(`Failed to fetch loader data: ${response.status}`);
    }
    const text = await response.text();
    // Modules are generated as: export default {json}
    const match = text.match(/export default (.+)$/m);
    if (match) {
        return JSON.parse(match[1]);
    }
    throw new Error('Invalid loader module format');
}
//# sourceMappingURL=utils.js.map