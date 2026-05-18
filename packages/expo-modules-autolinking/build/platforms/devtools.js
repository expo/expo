"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleAsync = resolveModuleAsync;
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
async function resolveModuleAsync(packageName, revision) {
    const devtoolsConfig = revision.config?.toJSON().devtools;
    if (devtoolsConfig == null) {
        return null;
    }
    return {
        packageName,
        packageRoot: revision.path,
        webpageRoot: await resolveWebpageRoot(revision.path, devtoolsConfig.webpageRoot),
    };
}
async function resolveWebpageRoot(packageRoot, configuredWebpageRoot) {
    if (!configuredWebpageRoot) {
        return undefined;
    }
    const resolvedWebpageRoot = path_1.default.resolve(packageRoot, configuredWebpageRoot);
    // NOTE(@kitten): Failing realpath-ing, typically due to ENOENT, results in the original value
    const webpageRoot = (await (0, utils_1.maybeRealpath)(resolvedWebpageRoot)) ?? resolvedWebpageRoot;
    return (0, utils_1.isPathInside)(webpageRoot, packageRoot) ? webpageRoot : undefined;
}
async function resolveExtraBuildDependenciesAsync(_projectNativeRoot) {
    return null;
}
//# sourceMappingURL=devtools.js.map