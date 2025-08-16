"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageListAsync = exports.generateModulesProviderAsync = exports.getConfiguration = void 0;
exports.findModulesAsync = apiFindModulesAsync;
exports.resolveExtraBuildDependenciesAsync = apiResolveExtraBuildDependenciesAsync;
exports.resolveModulesAsync = apiResolveModulesAsync;
const findModules_1 = require("./findModules");
const resolveModules_1 = require("./resolveModules");
var getConfiguration_1 = require("./getConfiguration");
Object.defineProperty(exports, "getConfiguration", { enumerable: true, get: function () { return getConfiguration_1.getConfiguration; } });
var generatePackageList_1 = require("./generatePackageList");
Object.defineProperty(exports, "generateModulesProviderAsync", { enumerable: true, get: function () { return generatePackageList_1.generateModulesProviderAsync; } });
Object.defineProperty(exports, "generatePackageListAsync", { enumerable: true, get: function () { return generatePackageList_1.generatePackageListAsync; } });
/** @deprecated */
async function apiFindModulesAsync(providedOptions) {
    return (0, findModules_1.findModulesAsync)({
        appRoot: providedOptions.projectRoot,
        autolinkingOptions: providedOptions,
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
    return (0, resolveModules_1.resolveModulesAsync)(searchResults, providedOptions);
}
//# sourceMappingURL=index.js.map