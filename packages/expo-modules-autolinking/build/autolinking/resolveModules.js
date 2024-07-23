"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExtraBuildDependenciesAsync = exports.resolveModulesAsync = void 0;
const utils_1 = require("./utils");
/**
 * Resolves search results to a list of platform-specific configuration.
 */
async function resolveModulesAsync(searchResults, options) {
    const platformLinking = (0, utils_1.getLinkingImplementationForPlatform)(options.platform);
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
/**
 * Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods.
 */
async function resolveExtraBuildDependenciesAsync(options) {
    const platformLinking = (0, utils_1.getLinkingImplementationForPlatform)(options.platform);
    const extraDependencies = await platformLinking.resolveExtraBuildDependenciesAsync(options.projectRoot);
    return extraDependencies ?? [];
}
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
//# sourceMappingURL=resolveModules.js.map