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
exports.verifySearchResults = exports.generatePackageListAsync = exports.generateModulesProviderAsync = exports.getConfiguration = exports.resolveModulesAsync = exports.resolveExtraBuildDependenciesAsync = exports.mergeLinkingOptionsAsync = exports.getProjectPackageJsonPathAsync = exports.findModulesAsync = void 0;
exports.resolveSearchPathsAsync = resolveSearchPathsAsync;
exports.queryAutolinkingModulesFromProjectAsync = queryAutolinkingModulesFromProjectAsync;
exports.findProjectRootSync = findProjectRootSync;
const path_1 = __importDefault(require("path"));
const findModules_1 = require("./findModules");
Object.defineProperty(exports, "findModulesAsync", { enumerable: true, get: function () { return findModules_1.findModulesAsync; } });
const mergeLinkingOptions_1 = require("./mergeLinkingOptions");
Object.defineProperty(exports, "getProjectPackageJsonPathAsync", { enumerable: true, get: function () { return mergeLinkingOptions_1.getProjectPackageJsonPathAsync; } });
Object.defineProperty(exports, "mergeLinkingOptionsAsync", { enumerable: true, get: function () { return mergeLinkingOptions_1.mergeLinkingOptionsAsync; } });
const resolveModules_1 = require("./resolveModules");
Object.defineProperty(exports, "resolveExtraBuildDependenciesAsync", { enumerable: true, get: function () { return resolveModules_1.resolveExtraBuildDependenciesAsync; } });
Object.defineProperty(exports, "resolveModulesAsync", { enumerable: true, get: function () { return resolveModules_1.resolveModulesAsync; } });
const getConfiguration_1 = require("./getConfiguration");
Object.defineProperty(exports, "getConfiguration", { enumerable: true, get: function () { return getConfiguration_1.getConfiguration; } });
var generatePackageList_1 = require("./generatePackageList");
Object.defineProperty(exports, "generateModulesProviderAsync", { enumerable: true, get: function () { return generatePackageList_1.generateModulesProviderAsync; } });
Object.defineProperty(exports, "generatePackageListAsync", { enumerable: true, get: function () { return generatePackageList_1.generatePackageListAsync; } });
var verifySearchResults_1 = require("./verifySearchResults");
Object.defineProperty(exports, "verifySearchResults", { enumerable: true, get: function () { return verifySearchResults_1.verifySearchResults; } });
__exportStar(require("../types"), exports);
async function resolveSearchPathsAsync(searchPaths, cwd) {
    return (0, mergeLinkingOptions_1.resolveSearchPaths)(searchPaths, cwd);
}
/**
 * Programmatic API to query autolinked modules for a project.
 */
async function queryAutolinkingModulesFromProjectAsync(projectRoot, options) {
    const searchPaths = await resolveSearchPathsAsync(null, projectRoot);
    const linkOptions = await (0, mergeLinkingOptions_1.mergeLinkingOptionsAsync)({ ...options, projectRoot, searchPaths });
    const searchResults = await (0, findModules_1.findModulesAsync)(linkOptions);
    return await (0, resolveModules_1.resolveModulesAsync)(searchResults, linkOptions);
}
/**
 * Get the project root directory from the current working directory.
 */
function findProjectRootSync(cwd = process.cwd()) {
    return path_1.default.dirname((0, mergeLinkingOptions_1.getProjectPackageJsonPathSync)(cwd));
}
//# sourceMappingURL=index.js.map