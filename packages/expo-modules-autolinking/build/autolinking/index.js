"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = void 0;
exports.findModulesAsync = apiFindModulesAsync;
exports.resolveExtraBuildDependenciesAsync = apiResolveExtraBuildDependenciesAsync;
exports.resolveModulesAsync = apiResolveModulesAsync;
const findModules_1 = require("./findModules");
const resolveModules_1 = require("./resolveModules");
const autolinkingOptions_1 = require("../commands/autolinkingOptions");
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
    return (0, resolveModules_1.resolveModulesAsync)(searchResults, await autolinkingOptionsLoader.getPlatformOptions(providedOptions.platform));
}
//# sourceMappingURL=index.js.map