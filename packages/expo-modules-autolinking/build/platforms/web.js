"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleAsync = resolveModuleAsync;
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
async function resolveModuleAsync(packageName, revision) {
    return {
        packageName,
        packageRoot: revision.path,
    };
}
async function resolveExtraBuildDependenciesAsync(_projectNativeRoot) {
    return null;
}
//# sourceMappingURL=web.js.map