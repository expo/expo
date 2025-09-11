"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDependenciesFromRNProjectConfig = scanDependenciesFromRNProjectConfig;
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
async function scanDependenciesFromRNProjectConfig(rawPath, projectConfig, { shouldIncludeDependency = utils_1.defaultShouldIncludeDependency } = {}) {
    const rootPath = await (0, utils_1.maybeRealpath)(rawPath);
    const searchResults = Object.create(null);
    if (!rootPath || !projectConfig || !projectConfig.dependencies) {
        return searchResults;
    }
    for (const dependencyName in projectConfig.dependencies) {
        if (!shouldIncludeDependency(dependencyName)) {
            continue;
        }
        const dependencyConfig = projectConfig.dependencies[dependencyName];
        if (dependencyConfig && dependencyConfig.root && typeof dependencyConfig.root === 'string') {
            const originPath = path_1.default.resolve(rootPath, dependencyConfig.root);
            const realPath = await (0, utils_1.maybeRealpath)(originPath);
            if (realPath) {
                searchResults[dependencyName] = {
                    source: 2 /* DependencyResolutionSource.RN_CLI_LOCAL */,
                    name: dependencyName,
                    version: '',
                    path: realPath,
                    originPath,
                    duplicates: null,
                    depth: 0,
                };
            }
        }
    }
    return searchResults;
}
//# sourceMappingURL=rncliLocal.js.map