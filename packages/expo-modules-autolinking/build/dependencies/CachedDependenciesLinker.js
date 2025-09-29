"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCachedDependenciesLinker = makeCachedDependenciesLinker;
exports.scanDependencyResolutionsForPlatform = scanDependencyResolutionsForPlatform;
exports.scanExpoModuleResolutionsForPlatform = scanExpoModuleResolutionsForPlatform;
const fs_1 = __importDefault(require("fs"));
const resolution_1 = require("./resolution");
const rncliLocal_1 = require("./rncliLocal");
const scanning_1 = require("./scanning");
const utils_1 = require("./utils");
const findModules_1 = require("../autolinking/findModules");
const autolinkingOptions_1 = require("../commands/autolinkingOptions");
const reactNativeConfig_1 = require("../reactNativeConfig");
const config_1 = require("../reactNativeConfig/config");
function makeCachedDependenciesLinker(params) {
    const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
        projectRoot: params.projectRoot,
    });
    let appRoot;
    const getAppRoot = () => appRoot || (appRoot = autolinkingOptionsLoader.getAppRoot());
    const dependenciesResultBySearchPath = new Map();
    let reactNativeProjectConfig;
    let reactNativeProjectConfigDependencies;
    let recursiveDependencies;
    return {
        async getOptionsForPlatform(platform) {
            const options = await autolinkingOptionsLoader.getPlatformOptions(platform);
            return makeCachedDependenciesSearchOptions(options);
        },
        async loadReactNativeProjectConfig() {
            if (reactNativeProjectConfig === undefined) {
                reactNativeProjectConfig = (0, config_1.loadConfigAsync)(await getAppRoot());
            }
            return reactNativeProjectConfig;
        },
        async scanDependenciesFromRNProjectConfig() {
            const reactNativeProjectConfig = await this.loadReactNativeProjectConfig();
            return (reactNativeProjectConfigDependencies ||
                (reactNativeProjectConfigDependencies = (0, rncliLocal_1.scanDependenciesFromRNProjectConfig)(await getAppRoot(), reactNativeProjectConfig)));
        },
        async scanDependenciesRecursively() {
            return (recursiveDependencies ||
                (recursiveDependencies = (0, resolution_1.scanDependenciesRecursively)(await getAppRoot())));
        },
        async scanDependenciesInSearchPath(searchPath) {
            let result = dependenciesResultBySearchPath.get(searchPath);
            if (!result) {
                dependenciesResultBySearchPath.set(searchPath, (result = (0, scanning_1.scanDependenciesInSearchPath)(searchPath)));
            }
            return result;
        },
    };
}
async function scanDependencyResolutionsForPlatform(linker, platform, include) {
    const { excludeNames, searchPaths } = await linker.getOptionsForPlatform(platform);
    const includeNames = new Set(include);
    const reactNativeProjectConfig = await linker.loadReactNativeProjectConfig();
    const resolutions = (0, utils_1.mergeResolutionResults)(await Promise.all([
        linker.scanDependenciesFromRNProjectConfig(),
        ...searchPaths.map((searchPath) => {
            return linker.scanDependenciesInSearchPath(searchPath);
        }),
        linker.scanDependenciesRecursively(),
    ]));
    const dependencies = await (0, utils_1.filterMapResolutionResult)(resolutions, async (resolution) => {
        if (excludeNames.has(resolution.name)) {
            return null;
        }
        else if (includeNames.has(resolution.name)) {
            return resolution;
        }
        else if (resolution.source === 2 /* DependencyResolutionSource.RN_CLI_LOCAL */) {
            // If the dependency was resolved frpom the React Native project config, we'll only
            // attempt to resolve it as a React Native module
            const reactNativeModuleDesc = await (0, reactNativeConfig_1.resolveReactNativeModule)(resolution, reactNativeProjectConfig, platform, excludeNames);
            if (!reactNativeModuleDesc) {
                return null;
            }
        }
        else {
            const [reactNativeModule, expoModule] = await Promise.all([
                (0, reactNativeConfig_1.resolveReactNativeModule)(resolution, reactNativeProjectConfig, platform, excludeNames),
                (0, findModules_1.resolveExpoModule)(resolution, platform, excludeNames),
            ]);
            if (!reactNativeModule && !expoModule) {
                return null;
            }
        }
        return resolution;
    });
    return dependencies;
}
async function scanExpoModuleResolutionsForPlatform(linker, platform) {
    const { excludeNames, searchPaths } = await linker.getOptionsForPlatform(platform);
    const resolutions = (0, utils_1.mergeResolutionResults)(await Promise.all([
        ...searchPaths.map((searchPath) => {
            return linker.scanDependenciesInSearchPath(searchPath);
        }),
        linker.scanDependenciesRecursively(),
    ].filter((x) => x != null)));
    return await (0, utils_1.filterMapResolutionResult)(resolutions, async (resolution) => {
        return !excludeNames.has(resolution.name)
            ? await (0, findModules_1.resolveExpoModule)(resolution, platform, excludeNames)
            : null;
    });
}
const makeCachedDependenciesSearchOptions = (options) => ({
    excludeNames: new Set(options.exclude),
    searchPaths: options.nativeModulesDir && fs_1.default.existsSync(options.nativeModulesDir)
        ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
        : (options.searchPaths ?? []),
});
//# sourceMappingURL=CachedDependenciesLinker.js.map