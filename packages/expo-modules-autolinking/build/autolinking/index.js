"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = void 0;
exports.findModulesAsync = apiFindModulesAsync;
exports.resolveExtraBuildDependenciesAsync = apiResolveExtraBuildDependenciesAsync;
exports.resolveModulesAsync = apiResolveModulesAsync;
const findModules_1 = require("./findModules");
const resolveModules_1 = require("./resolveModules");
const autolinkingOptions_1 = require("../commands/autolinkingOptions");
const dependencies_1 = require("../dependencies");
var getConfiguration_1 = require("./getConfiguration");
Object.defineProperty(exports, "getConfiguration", { enumerable: true, get: function () { return getConfiguration_1.getConfiguration; } });
/** @deprecated */
async function apiFindModulesAsync(providedOptions) {
    const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)(providedOptions);
    return (0, findModules_1.findModulesAsync)({
        appRoot: await autolinkingOptionsLoader.getAppRoot(),
        autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(providedOptions.platform),
    });
}
/** @deprecated */
async function apiResolveExtraBuildDependenciesAsync(providedOptions) {
    return (0, resolveModules_1.resolveExtraBuildDependenciesAsync)({
        commandRoot: providedOptions.projectRoot,
        platform: providedOptions.platform,
    });
}
/** @deprecated */
async function apiResolveModulesAsync(searchResults, providedOptions) {
    const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)(providedOptions);
    const appRoot = await autolinkingOptionsLoader.getAppRoot();
    const linker = (0, dependencies_1.makeCachedDependenciesLinker)({ projectRoot: appRoot });
    // The RN-config resolver needs a concrete platform; map the `apple` umbrella to `ios`.
    const dependencyPlatform = providedOptions.platform === 'apple' ? 'ios' : providedOptions.platform;
    const dependencyResolutions = await (0, dependencies_1.scanDependencyResolutionsForPlatform)(linker, dependencyPlatform);
    return (0, resolveModules_1.resolveModulesAsync)(searchResults, await autolinkingOptionsLoader.getPlatformOptions(providedOptions.platform), {
        resolvedDependencyNames: new Set(Object.keys(dependencyResolutions)),
        commandRoot: autolinkingOptionsLoader.getCommandRoot(),
    });
}
//# sourceMappingURL=index.js.map