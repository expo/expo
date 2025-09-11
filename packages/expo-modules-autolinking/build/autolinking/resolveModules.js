"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModulesAsync = resolveModulesAsync;
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
const platforms_1 = require("../platforms");
/** Resolves search results to a list of platform-specific configuration. */
async function resolveModulesAsync(searchResults, autolinkingOptions) {
    const platformLinking = (0, platforms_1.getLinkingImplementationForPlatform)(autolinkingOptions.platform);
    // Additional output property for Cocoapods flags
    const extraOutput = { flags: autolinkingOptions.flags };
    const moduleDescriptorList = await Promise.all(Object.entries(searchResults).map(async ([packageName, revision]) => {
        const resolvedModule = await platformLinking.resolveModuleAsync(packageName, revision, extraOutput);
        return resolvedModule
            ? {
                ...resolvedModule,
                packageVersion: revision.version,
                packageName: resolvedModule.packageName ?? packageName,
            }
            : null;
    }));
    return moduleDescriptorList
        .filter((moduleDescriptor) => moduleDescriptor != null)
        .sort((a, b) => a.packageName.localeCompare(b.packageName));
}
/** Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods. */
async function resolveExtraBuildDependenciesAsync({ commandRoot, platform, }) {
    const platformLinking = (0, platforms_1.getLinkingImplementationForPlatform)(platform);
    const extraDependencies = await platformLinking.resolveExtraBuildDependenciesAsync(
    // NOTE: We assume we must be inside the native folder here
    // The `resolve` command either is invoked in the CWD of `./{android,ios}` or has a `--project-root`
    // that's in the native directory
    commandRoot);
    return extraDependencies ?? [];
}
//# sourceMappingURL=resolveModules.js.map