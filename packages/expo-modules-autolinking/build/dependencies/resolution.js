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
    const modules = [];
    const dependencies = packageJson.dependencies != null && typeof packageJson.dependencies === 'object'
        ? packageJson.dependencies
        : {};
    for (const dependencyName in dependencies) {
        if (!shouldIncludeDependency(dependencyName)) {
            continue;
        }
        for (let idx = 0; idx < nodeModulePaths.length; idx++) {
            const originPath = (0, utils_1.fastJoin)(nodeModulePaths[idx], dependencyName);
            const nodeModulePath = await (0, utils_1.maybeRealpath)(originPath);
            if (nodeModulePath != null) {
                modules.push({
                    source: 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */,
                    name: dependencyName,
                    version: '',
                    path: nodeModulePath,
                    originPath,
                    duplicates: null,
                    depth,
                });
                break;
            }
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
            for (let idx = 0; idx < nodeModulePaths.length; idx++) {
                const originPath = (0, utils_1.fastJoin)(nodeModulePaths[idx], dependencyName);
                const nodeModulePath = await (0, utils_1.maybeRealpath)(originPath);
                if (nodeModulePath != null) {
                    modules.push({
                        source: 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */,
                        name: dependencyName,
                        version: '',
                        path: nodeModulePath,
                        originPath,
                        duplicates: null,
                        depth,
                    });
                    break;
                }
            }
        }
    }
    return modules;
}
async function scanDependenciesRecursively(rawPath, { shouldIncludeDependency = utils_1.defaultShouldIncludeDependency, limitDepth } = {}) {
    const rootPath = await (0, utils_1.maybeRealpath)(rawPath);
    if (!rootPath) {
        return {};
    }
    const modulePathsQueue = [
        {
            source: 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */,
            name: '',
            version: '',
            path: rootPath,
            originPath: rawPath,
            duplicates: null,
            depth: -1,
        },
    ];
    const _visitedPackagePaths = new Set();
    const getNodeModulePaths = createNodeModulePathsCreator();
    const searchResults = Object.create(null);
    const maxDepth = limitDepth != null ? limitDepth : MAX_DEPTH;
    for (let depth = 0; modulePathsQueue.length > 0 && depth < maxDepth; depth++) {
        const resolutions = await Promise.all(modulePathsQueue.map(async (resolution) => {
            const nodeModulePaths = await getNodeModulePaths(resolution.path);
            const packageJson = await (0, utils_1.loadPackageJson)((0, utils_1.fastJoin)(resolution.path, 'package.json'));
            if (packageJson) {
                resolution.version = packageJson.version || '';
                return await resolveDependencies(packageJson, nodeModulePaths, depth, shouldIncludeDependency);
            }
            else {
                return [];
            }
        }));
        modulePathsQueue.length = 0;
        for (let resolutionIdx = 0; resolutionIdx < resolutions.length; resolutionIdx++) {
            const modules = resolutions[resolutionIdx];
            for (let moduleIdx = 0; moduleIdx < modules.length; moduleIdx++) {
                const resolution = modules[moduleIdx];
                if (_visitedPackagePaths.has(resolution.path)) {
                    continue;
                }
                _visitedPackagePaths.add(resolution.path);
                modulePathsQueue.push(resolution);
                const prevEntry = searchResults[resolution.name];
                if (prevEntry != null && resolution.path !== prevEntry.path) {
                    searchResults[resolution.name] = (0, utils_1.mergeWithDuplicate)(prevEntry, resolution);
                }
                else if (prevEntry == null) {
                    searchResults[resolution.name] = resolution;
                }
            }
        }
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