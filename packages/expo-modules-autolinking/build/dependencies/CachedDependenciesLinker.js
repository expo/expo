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
const memoize_1 = require("../memoize");
const reactNativeConfig_1 = require("../reactNativeConfig");
const config_1 = require("../reactNativeConfig/config");
function makeCachedDependenciesLinker(params) {
    const memoizer = (0, memoize_1.createMemoizer)();
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
        memoizer,
        async getOptionsForPlatform(platform) {
            const options = await autolinkingOptionsLoader.getPlatformOptions(platform);
            return makeCachedDependenciesSearchOptions(options);
        },
        async loadReactNativeProjectConfig() {
            if (reactNativeProjectConfig === undefined) {
                reactNativeProjectConfig = memoizer.call(config_1.loadConfigAsync, await getAppRoot());
            }
            return reactNativeProjectConfig;
        },
        async scanDependenciesFromRNProjectConfig() {
            if (reactNativeProjectConfigDependencies === undefined) {
                reactNativeProjectConfigDependencies = memoizer.withMemoizer(async () => {
                    return await (0, rncliLocal_1.scanDependenciesFromRNProjectConfig)(await getAppRoot(), await this.loadReactNativeProjectConfig());
                });
            }
            return reactNativeProjectConfigDependencies;
        },
        async scanDependenciesRecursively() {
            if (recursiveDependencies === undefined) {
                recursiveDependencies = memoizer.withMemoizer(async () => {
                    return (0, resolution_1.scanDependenciesRecursively)(await getAppRoot());
                });
            }
            return recursiveDependencies;
        },
        async scanDependenciesInSearchPath(searchPath) {
            let result = dependenciesResultBySearchPath.get(searchPath);
            if (!result) {
                dependenciesResultBySearchPath.set(searchPath, (result = memoizer.withMemoizer(scanning_1.scanDependenciesInSearchPath, searchPath)));
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
    return await linker.memoizer.withMemoizer(async () => {
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
    });
}
async function scanExpoModuleResolutionsForPlatform(linker, platform) {
    const { excludeNames, searchPaths } = await linker.getOptionsForPlatform(platform);
    const resolutions = (0, utils_1.mergeResolutionResults)(await Promise.all([
        ...searchPaths.map((searchPath) => {
            return linker.scanDependenciesInSearchPath(searchPath);
        }),
        linker.scanDependenciesRecursively(),
    ].filter((x) => x != null)));
    return await linker.memoizer.withMemoizer(async () => {
        return await (0, utils_1.filterMapResolutionResult)(resolutions, async (resolution) => {
            return !excludeNames.has(resolution.name)
                ? await (0, findModules_1.resolveExpoModule)(resolution, platform, excludeNames)
                : null;
        });
    });
}
const makeCachedDependenciesSearchOptions = (options) => ({
    excludeNames: new Set(options.exclude),
    searchPaths: options.nativeModulesDir && fs_1.default.existsSync(options.nativeModulesDir)
        ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
        : (options.searchPaths ?? []),
});
//# sourceMappingURL=CachedDependenciesLinker.js.map