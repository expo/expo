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
        const nodeModulePaths = await Promise.all(node_module_1.default._nodeModulePaths(packagePath).map(async (nodeModulePath, idx) => {
            let target = _nodeModulePathCache.get(nodeModulePath);
            if (target === undefined) {
                target = await (0, utils_1.maybeRealpath)(nodeModulePath);
                if (idx !== 0) {
                    _nodeModulePathCache.set(nodeModulePath, target);
                }
            }
            return target;
        }));
        return nodeModulePaths.filter((nodeModulePath) => nodeModulePath != null);
    };
};
async function resolveDependencies(packageJson, nodeModulePaths, depth, shouldIncludeDependency) {
    const dependencies = packageJson.dependencies != null && typeof packageJson.dependencies === 'object'
        ? packageJson.dependencies
        : {};
    const dependencyNames = [];
    for (const dependencyName in dependencies) {
        if (shouldIncludeDependency(dependencyName)) {
            dependencyNames.push(dependencyName);
        }
    }
    if (packageJson.peerDependencies != null && typeof packageJson.peerDependencies === 'object') {
        const peerDependenciesMeta = packageJson.peerDependenciesMeta != null &&
            typeof packageJson.peerDependenciesMeta === 'object'
            ? packageJson.peerDependenciesMeta
            : undefined;
        for (const dependencyName in packageJson.peerDependencies) {
            if (dependencyName in dependencies || !shouldIncludeDependency(dependencyName)) {
                continue;
            }
            else if (isOptionalPeerDependencyMeta(peerDependenciesMeta, dependencyName)) {
                // NOTE(@kitten): We only check peer dependencies because some package managers auto-install them
                // which would mean they'd have no reference in any dependencies. However, optional peer dependencies
                // don't auto-install and we can skip them
                continue;
            }
            else {
                dependencyNames.push(dependencyName);
            }
        }
    }
    const modules = await Promise.all(dependencyNames.map(async (dependencyName) => {
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
    }));
    return modules.filter((moduleEntry) => moduleEntry != null);
}
async function scanDependenciesRecursively(rawPath, { shouldIncludeDependency = utils_1.defaultShouldIncludeDependency, limitDepth } = {}) {
    const _visitedPackagePaths = new Set();
    const getNodeModulePaths = createNodeModulePathsCreator();
    const maxDepth = limitDepth != null ? limitDepth : MAX_DEPTH;
    const searchResults = Object.create(null);
    const recurseDependencies = async (parent) => {
        const nodeModulePaths = await getNodeModulePaths(parent.path);
        const packageJson = await (0, utils_1.loadPackageJson)((0, utils_1.fastJoin)(parent.path, 'package.json'));
        if (!packageJson) {
            return;
        }
        parent.version = packageJson.version || '';
        const depth = parent.depth + 1;
        if (depth >= maxDepth) {
            return;
        }
        const resolutions = await resolveDependencies(packageJson, nodeModulePaths, depth, shouldIncludeDependency);
        const tasks = [];
        for (let idx = 0; idx < resolutions.length; idx++) {
            const resolution = resolutions[idx];
            if (!_visitedPackagePaths.has(resolution.path)) {
                _visitedPackagePaths.add(resolution.path);
                const prevEntry = searchResults[resolution.name];
                if (prevEntry != null && resolution.path !== prevEntry.path) {
                    searchResults[resolution.name] = (0, utils_1.mergeWithDuplicate)(prevEntry, resolution);
                }
                else if (prevEntry == null) {
                    searchResults[resolution.name] = resolution;
                }
                tasks.push(recurseDependencies(resolution));
            }
        }
        await Promise.all(tasks);
    };
    const rootPath = await (0, utils_1.maybeRealpath)(rawPath);
    if (rootPath) {
        await recurseDependencies({
            source: 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */,
            name: '',
            version: '',
            path: rootPath,
            originPath: rawPath,
            duplicates: null,
            depth: -1,
        });
    }
    return searchResults;
}
const isOptionalPeerDependencyMeta = (peerDependenciesMeta, packageName) => {
    return (peerDependenciesMeta &&
        peerDependenciesMeta[packageName] != null &&
        typeof peerDependenciesMeta[packageName] === 'object' &&
        'optional' in peerDependenciesMeta[packageName] &&
        !!peerDependenciesMeta[packageName].optional);
};
//# sourceMappingURL=resolution.js.map