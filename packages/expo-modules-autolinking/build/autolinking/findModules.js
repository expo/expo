"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findModulesAsync = findModulesAsync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mergeLinkingOptions_1 = require("./mergeLinkingOptions");
const ExpoModuleConfig_1 = require("../ExpoModuleConfig");
const dependencies_1 = require("../dependencies");
/** Names of Expo Module config files (highest to lowest priority) */
const EXPO_MODULE_CONFIG_FILENAMES = ['expo-module.config.json', 'unimodule.json'];
async function resolveExpoModule(resolution, platform, excludeNames) {
    if (excludeNames.has(resolution.name)) {
        return null;
    }
    let expoModuleConfig = null;
    for (let idx = 0; idx < EXPO_MODULE_CONFIG_FILENAMES.length; idx++) {
        try {
            expoModuleConfig = await (0, ExpoModuleConfig_1.loadExpoModuleConfigAsync)(path_1.default.join(resolution.path, EXPO_MODULE_CONFIG_FILENAMES[idx]));
            break;
        }
        catch {
            // try the next file
        }
    }
    if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
        return {
            name: resolution.name,
            path: resolution.path,
            version: resolution.version,
            config: expoModuleConfig,
            duplicates: resolution.duplicates?.map((duplicate) => ({
                name: resolution.name,
                path: duplicate,
                version: '', // NOTE: Are we actually using this?
            })) ?? [],
        };
    }
    else {
        return null;
    }
}
/**
 * Searches for modules to link based on given config.
 */
async function findModulesAsync(providedOptions) {
    const options = await (0, mergeLinkingOptions_1.mergeLinkingOptionsAsync)(providedOptions);
    const excludeNames = new Set(options.exclude);
    // custom native modules should be resolved first so that they can override other modules
    const searchPaths = options.nativeModulesDir && fs_1.default.existsSync(options.nativeModulesDir)
        ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
        : (options.searchPaths ?? []);
    return (0, dependencies_1.filterMapResolutionResult)((0, dependencies_1.mergeResolutionResults)(await Promise.all([
        ...searchPaths.map((searchPath) => (0, dependencies_1.scanDependenciesInSearchPath)(searchPath)),
        (0, dependencies_1.scanDependenciesRecursively)(options.projectRoot),
    ])), (resolution) => resolveExpoModule(resolution, options.platform, excludeNames));
}
//# sourceMappingURL=findModules.js.map