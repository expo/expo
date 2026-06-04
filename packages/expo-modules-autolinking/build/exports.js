"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanExpoModuleResolutionsForPlatform = exports.scanDependencyResolutionsForPlatform = exports.makeCachedDependenciesLinker = void 0;
exports.mergeLinkingOptionsAsync = mergeLinkingOptionsAsync;
exports.queryAutolinkingModulesFromProjectAsync = queryAutolinkingModulesFromProjectAsync;
exports.findProjectRootSync = findProjectRootSync;
exports.resolveSearchPathsAsync = resolveSearchPathsAsync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolveModules_1 = require("./autolinking/resolveModules");
const autolinkingOptions_1 = require("./commands/autolinkingOptions");
const dependencies_1 = require("./dependencies");
__exportStar(require("./types"), exports);
__exportStar(require("./autolinking"), exports);
__exportStar(require("./platforms"), exports);
var dependencies_2 = require("./dependencies");
Object.defineProperty(exports, "makeCachedDependenciesLinker", { enumerable: true, get: function () { return dependencies_2.makeCachedDependenciesLinker; } });
Object.defineProperty(exports, "scanDependencyResolutionsForPlatform", { enumerable: true, get: function () { return dependencies_2.scanDependencyResolutionsForPlatform; } });
Object.defineProperty(exports, "scanExpoModuleResolutionsForPlatform", { enumerable: true, get: function () { return dependencies_2.scanExpoModuleResolutionsForPlatform; } });
__exportStar(require("./utilities"), exports);
/** @deprecated */
async function mergeLinkingOptionsAsync(argumentsOptions) {
    const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)(argumentsOptions);
    return {
        ...argumentsOptions,
        ...(await autolinkingOptionsLoader.getPlatformOptions()),
        projectRoot: autolinkingOptionsLoader.getAppRoot(),
    };
}
/** @deprecated */
async function queryAutolinkingModulesFromProjectAsync(projectRoot, options) {
    const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
        ...options,
        // NOTE(@kitten): This has always been duplicated
        projectRoot: options.projectRoot ?? projectRoot,
    });
    const appRoot = await autolinkingOptionsLoader.getAppRoot();
    const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(options.platform);
    const linker = (0, dependencies_1.makeCachedDependenciesLinker)({ projectRoot: appRoot });
    // The RN-config resolver needs a concrete platform; map the `apple` umbrella to `ios`.
    const dependencyPlatform = options.platform === 'apple' ? 'ios' : options.platform;
    const [searchResults, dependencyResolutions] = await Promise.all([
        (0, dependencies_1.scanExpoModuleResolutionsForPlatform)(linker, options.platform),
        (0, dependencies_1.scanDependencyResolutionsForPlatform)(linker, dependencyPlatform),
    ]);
    return await (0, resolveModules_1.resolveModulesAsync)(searchResults, autolinkingOptions, {
        resolvedDependencyNames: new Set(Object.keys(dependencyResolutions)),
        commandRoot: autolinkingOptionsLoader.getCommandRoot(),
    });
}
/** @deprecated */
function findProjectRootSync(cwd = process.cwd()) {
    for (let dir = cwd; path_1.default.dirname(dir) !== dir; dir = path_1.default.dirname(dir)) {
        const file = path_1.default.resolve(dir, 'package.json');
        if (fs_1.default.existsSync(file)) {
            return file;
        }
    }
    throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
}
/** @deprecated */
async function resolveSearchPathsAsync(searchPaths, cwd) {
    return (0, autolinkingOptions_1.filterMapSearchPaths)(searchPaths, cwd) ?? [];
}
//# sourceMappingURL=exports.js.map