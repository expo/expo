"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModulesAsync = void 0;
/**
 * Resolves search results to a list of platform-specific configuration.
 */
async function resolveModulesAsync(searchResults, options) {
    const platformLinking = require(`../platforms/${options.platform}`);
    return (await Promise.all(Object.entries(searchResults).map(async ([packageName, revision]) => {
        const resolvedModule = await platformLinking.resolveModuleAsync(packageName, revision, options);
        return resolvedModule
            ? {
                packageName,
                packageVersion: revision.version,
                ...resolvedModule,
            }
            : null;
    })))
        .filter(Boolean)
        .sort((a, b) => a.packageName.localeCompare(b.packageName));
}
exports.resolveModulesAsync = resolveModulesAsync;
//# sourceMappingURL=resolveModules.js.map