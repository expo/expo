"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExpoModule = resolveExpoModule;
exports.findModulesAsync = findModulesAsync;
const ExpoModuleConfig_1 = require("../ExpoModuleConfig");
const dependencies_1 = require("../dependencies");
async function resolveExpoModule(resolution, platform, excludeNames) {
    if (excludeNames.has(resolution.name)) {
        return null;
    }
    const expoModuleConfig = await (0, ExpoModuleConfig_1.discoverExpoModuleConfigAsync)(resolution.path);
    if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
        return {
            name: resolution.name,
            path: resolution.path,
            version: resolution.version,
            config: expoModuleConfig,
            duplicates: resolution.duplicates?.map((duplicate) => ({
                name: duplicate.name,
                path: duplicate.path,
                version: duplicate.version,
            })) ?? [],
        };
    }
    else {
        return null;
    }
}
/** Searches for modules to link based on given config. */
async function findModulesAsync({ appRoot, autolinkingOptions, }) {
    const excludeNames = new Set(autolinkingOptions.exclude);
    // custom native modules should be resolved first so that they can override other modules
    const searchPaths = autolinkingOptions.nativeModulesDir
        ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
        : autolinkingOptions.searchPaths;
    return (0, dependencies_1.filterMapResolutionResult)((0, dependencies_1.mergeResolutionResults)(await Promise.all([
        ...searchPaths.map((searchPath) => (0, dependencies_1.scanDependenciesInSearchPath)(searchPath)),
        (0, dependencies_1.scanDependenciesRecursively)(appRoot),
    ])), (resolution) => resolveExpoModule(resolution, autolinkingOptions.platform, excludeNames));
}
//# sourceMappingURL=findModules.js.map