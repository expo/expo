"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleAsync = resolveModuleAsync;
async function resolveModuleAsync(packageName, revision) {
    const cliConfig = revision.config?.toJSON().cli;
    if (cliConfig == null) {
        return null;
    }
    return {
        packageName,
        packageRoot: revision.path,
        ...cliConfig,
    };
}
//# sourceMappingURL=cli.js.map