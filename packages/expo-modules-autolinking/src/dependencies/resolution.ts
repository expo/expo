import Module from 'node:module';

import {
  type ResolutionResult,
  type DependencyResolution,
  DependencyResolutionSource,
} from './types';
import {
  type PackageJson,
  defaultShouldIncludeDependency,
  mergeWithDuplicate,
  loadPackageJson,
  maybeRealpath,
  fastJoin,
} from './utils';

declare module 'node:module' {
  export function _nodeModulePaths(base: string): readonly string[];
}

// NOTE(@kitten): There's no need to search very deep for modules
// We don't expect native modules to be excessively nested in the dependency tree
const MAX_DEPTH = 8;

const createNodeModulePathsCreator = () => {
  const _nodeModulePathCache = new Map<string, string | null>();
  return async function getNodeModulePaths(packagePath: string) {
    const outputPaths: string[] = [];
    const nodeModulePaths = Module._nodeModulePaths(packagePath);
    for (let idx = 0; idx < nodeModulePaths.length; idx++) {
      const nodeModulePath = nodeModulePaths[idx];
      let target = _nodeModulePathCache.get(nodeModulePath);
      if (target === undefined) {
        target = await maybeRealpath(nodeModulePath);
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

async function resolveDependencies(
  packageJson: PackageJson,
  nodeModulePaths: readonly string[],
  depth: number,
  shouldIncludeDependency: (dependencyName: string) => boolean
): Promise<DependencyResolution[]> {
  const modules: DependencyResolution[] = [];
  let dependencies =
    packageJson.dependencies != null && typeof packageJson.dependencies === 'object'
      ? packageJson.dependencies
      : {};

  // NOTE(@kitten): Also traverse devDependencies for top-level package.json
  const devDependencies =
    packageJson.devDependencies != null && typeof packageJson.devDependencies === 'object'
      ? (packageJson.devDependencies as Record<string, string>)
      : null;
  if (depth === 0 && devDependencies) {
    dependencies = { ...dependencies, ...devDependencies };
  }

  for (const dependencyName in dependencies) {
    if (!shouldIncludeDependency(dependencyName)) {
      continue;
    }
    for (let idx = 0; idx < nodeModulePaths.length; idx++) {
      const originPath = fastJoin(nodeModulePaths[idx], dependencyName);
      const nodeModulePath = await maybeRealpath(originPath);
      if (nodeModulePath != null) {
        modules.push({
          source: DependencyResolutionSource.RECURSIVE_RESOLUTION,
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
    const peerDependenciesMeta =
      packageJson.peerDependenciesMeta != null &&
      typeof packageJson.peerDependenciesMeta === 'object'
        ? (packageJson.peerDependenciesMeta as Record<string, unknown>)
        : undefined;
    for (const dependencyName in packageJson.peerDependencies) {
      if (dependencyName in dependencies || !shouldIncludeDependency(dependencyName)) {
        continue;
      } else if (isOptionalPeerDependencyMeta(peerDependenciesMeta, dependencyName)) {
        // NOTE(@kitten): We only check peer dependencies because some package managers auto-install them
        // which would mean they'd have no reference in any dependencies. However, optional peer dependencies
        // don't auto-install and we can skip them
        continue;
      }
      for (let idx = 0; idx < nodeModulePaths.length; idx++) {
        const originPath = fastJoin(nodeModulePaths[idx], dependencyName);
        const nodeModulePath = await maybeRealpath(originPath);
        if (nodeModulePath != null) {
          modules.push({
            source: DependencyResolutionSource.RECURSIVE_RESOLUTION,
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

interface ResolutionOptions {
  shouldIncludeDependency?(name: string): boolean;
  limitDepth?: number;
}

export async function scanDependenciesRecursively(
  rawPath: string,
  { shouldIncludeDependency = defaultShouldIncludeDependency, limitDepth }: ResolutionOptions = {}
): Promise<ResolutionResult> {
  const rootPath = await maybeRealpath(rawPath);
  if (!rootPath) {
    return {};
  }

  const modulePathsQueue: DependencyResolution[] = [
    {
      source: DependencyResolutionSource.RECURSIVE_RESOLUTION,
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
  const searchResults: ResolutionResult = Object.create(null);
  const maxDepth = limitDepth != null ? limitDepth : MAX_DEPTH;
  for (let depth = 0; modulePathsQueue.length > 0 && depth < maxDepth; depth++) {
    const resolutions = await Promise.all(
      modulePathsQueue.map(async (resolution) => {
        const nodeModulePaths = await getNodeModulePaths(resolution.path);
        const packageJson = await loadPackageJson(fastJoin(resolution.path, 'package.json'));
        if (packageJson) {
          resolution.version = packageJson.version || '';
          return await resolveDependencies(
            packageJson,
            nodeModulePaths,
            depth,
            shouldIncludeDependency
          );
        } else {
          return [];
        }
      })
    );

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
          searchResults[resolution.name] = mergeWithDuplicate(prevEntry, resolution);
        } else if (prevEntry == null) {
          searchResults[resolution.name] = resolution;
        }
      }
    }
  }

  return searchResults;
}

const isOptionalPeerDependencyMeta = (
  peerDependenciesMeta: Record<string, unknown> | undefined,
  packageName: string
) => {
  return (
    peerDependenciesMeta &&
    peerDependenciesMeta[packageName] != null &&
    typeof peerDependenciesMeta[packageName] === 'object' &&
    'optional' in peerDependenciesMeta[packageName] &&
    !!peerDependenciesMeta[packageName].optional
  );
};
