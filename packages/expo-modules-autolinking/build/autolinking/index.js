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
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAutolinkingModulesFromProjectAsync = exports.verifySearchResults = exports.generatePackageListAsync = exports.resolveSearchPathsAsync = exports.resolveModulesAsync = exports.mergeLinkingOptionsAsync = exports.findModulesAsync = void 0;
const findModules_1 = require("./findModules");
Object.defineProperty(exports, "findModulesAsync", { enumerable: true, get: function () { return findModules_1.findModulesAsync; } });
const mergeLinkingOptions_1 = require("./mergeLinkingOptions");
Object.defineProperty(exports, "mergeLinkingOptionsAsync", { enumerable: true, get: function () { return mergeLinkingOptions_1.mergeLinkingOptionsAsync; } });
Object.defineProperty(exports, "resolveSearchPathsAsync", { enumerable: true, get: function () { return mergeLinkingOptions_1.resolveSearchPathsAsync; } });
const resolveModules_1 = require("./resolveModules");
Object.defineProperty(exports, "resolveModulesAsync", { enumerable: true, get: function () { return resolveModules_1.resolveModulesAsync; } });
var generatePackageList_1 = require("./generatePackageList");
Object.defineProperty(exports, "generatePackageListAsync", { enumerable: true, get: function () { return generatePackageList_1.generatePackageListAsync; } });
var verifySearchResults_1 = require("./verifySearchResults");
Object.defineProperty(exports, "verifySearchResults", { enumerable: true, get: function () { return verifySearchResults_1.verifySearchResults; } });
__exportStar(require("../types"), exports);
/**
 * Programmatic API to query autolinked modules for a project.
 */
async function queryAutolinkingModulesFromProjectAsync(projectRoot, options) {
    const searchPaths = await (0, mergeLinkingOptions_1.resolveSearchPathsAsync)(null, projectRoot);
    const linkOptions = await (0, mergeLinkingOptions_1.mergeLinkingOptionsAsync)({ ...options, projectRoot, searchPaths });
    const searchResults = await (0, findModules_1.findModulesAsync)(linkOptions);
    return await (0, resolveModules_1.resolveModulesAsync)(searchResults, linkOptions);
}
exports.queryAutolinkingModulesFromProjectAsync = queryAutolinkingModulesFromProjectAsync;
//# sourceMappingURL=index.js.map