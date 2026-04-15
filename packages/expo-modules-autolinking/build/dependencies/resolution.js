"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDependenciesRecursively = scanDependenciesRecursively;
const node_module_1 = __importDefault(require("node:module"));
const utils_1 = require("./utils");
// NOTE(@kitten): There's no need to search very deep for modules
// We don't expect native modules to be excessively nested in the dependency tree
const MAX_DEPTH = 8;
const createNodeModulePathsCreator = () => {
    const _nodeModulePathCache = new Map();
    return async function getNodeModulePaths(packagePath) {
        const outputPaths = [];
        const nodeModulePaths = node_module_1.default._nodeModulePaths(packagePath);
        for (let idx = 0; idx < nodeModulePaths.length; idx++) {
            const nodeModulePath = nodeModulePaths[idx];
            let target = _nodeModulePathCache.get(nodeModulePath);
            if (target === undefined) {
                target = await (0, utils_1.maybeRealpath)(nodeModulePath);
                if (idx !== 0) {
                    _nodeModulePathCache.set(nodeModulePath, target);
                }
            }
            if (target != null) {
                outputPaths.push(target);
            }
        }
        return outputPaths;
    };
};
async function resolveDependencies(packageJson, nodeModulePaths, depth, shouldIncludeDependency) {
    const dependencies = Object.create(null);
    if (packageJson.dependencies != null && typeof packageJson.dependencies === 'object') {
        Object.assign(dependencies, packageJson.dependencies);
    }
    // NOTE(@kitten): Also traverse devDependencies for top-level package.json
    if (depth === 0 &&
        packageJson.devDependencies != null &&
        typeof packageJson.devDependencies === 'object') {
        Object.assign(dependencies, packageJson.devDependencies);
    }
    if (packageJson.peerDependencies != null && typeof packageJson.peerDependencies === 'object') {
        for (const dependencyName in packageJson.peerDependencies) {
            // NOTE: We always attempt to resolve peer dependencies — including optional ones — because
            // package managers (npm 7+) will auto-install an optional peer when the project's version
            // doesn't satisfy its range. Walking into those auto-installed copies is required to detect
            // duplicates of bundled native modules. `resolveDependency` already returns null when the
            // package isn't on disk, so genuinely uninstalled optional peers are still filtered out.
            dependencies[dependencyName] = '';
        }
    }
    const resolveDependency = async (dependencyName) => {
        for (let idx = 0; idx < nodeModulePaths.length; idx++) {
            const originPath = (0, utils_1.fastJoin)(nodeModulePaths[idx], dependencyName);
            const nodeModulePath = await (0, utils_1.maybeRealpath)(originPath);
            if (nodeModulePath != null) {
                return {
                    source: 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */,
                    name: dependencyName,
                    version: '',
                    path: nodeModulePath,
                    originPath,
                    duplicates: null,
                    depth,
                };
            }
        }
        return null;
    };
    const modules = await Promise.all(Object.keys(dependencies)
        .filter((dependencyName) => shouldIncludeDependency(dependencyName))
        .map((dependencyName) => resolveDependency(dependencyName)));
    return modules.filter((resolution) => resolution != null);
}
async function scanDependenciesRecursively(rawPath, { shouldIncludeDependency = utils_1.defaultShouldIncludeDependency, limitDepth } = {}) {
    const rootPath = await (0, utils_1.maybeRealpath)(rawPath);
    if (!rootPath) {
        return {};
    }
    const _visitedPackagePaths = new Set();
    const getNodeModulePaths = createNodeModulePathsCreator();
    const maxDepth = limitDepth != null ? limitDepth : MAX_DEPTH;
    const recurse = async (resolution, depth = 0) => {
        const searchResults = Object.create(null);
        if (_visitedPackagePaths.has(resolution.path)) {
            return searchResults;
        }
        else {
            _visitedPackagePaths.add(resolution.path);
        }
        const [nodeModulePaths, packageJson] = await Promise.all([
            getNodeModulePaths(resolution.path),
            (0, utils_1.loadPackageJson)((0, utils_1.fastJoin)(resolution.path, 'package.json')),
        ]);
        if (!packageJson) {
            return searchResults;
        }
        else {
            resolution.version = packageJson.version || '';
        }
        const modules = await resolveDependencies(packageJson, nodeModulePaths, depth, shouldIncludeDependency);
        for (let idx = 0; idx < modules.length; idx++) {
            searchResults[modules[idx].name] = modules[idx];
        }
        if (depth + 1 < maxDepth) {
            const childResults = await Promise.all(modules.map((resolution) => recurse(resolution, depth + 1)));
            return (0, utils_1.mergeResolutionResults)(childResults, searchResults);
        }
        else {
            return searchResults;
        }
    };
    const searchResults = await recurse({
        source: 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */,
        name: '',
        version: '',
        path: rootPath,
        originPath: rawPath,
        duplicates: null,
        depth: -1,
    });
    return searchResults;
}
//# sourceMappingURL=resolution.js.map