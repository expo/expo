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
  const dependencies =
    packageJson.dependencies != null && typeof packageJson.dependencies === 'object'
      ? packageJson.dependencies
      : {};

  const dependencyNames: string[] = [];
  for (const dependencyName in dependencies) {
    if (shouldIncludeDependency(dependencyName)) {
      dependencyNames.push(dependencyName);
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
      } else {
        dependencyNames.push(dependencyName);
      }
    }
  }

  const modules = await Promise.all(
    dependencyNames.map(async (dependencyName): Promise<DependencyResolution | null> => {
      for (let idx = 0; idx < nodeModulePaths.length; idx++) {
        const originPath = fastJoin(nodeModulePaths[idx], dependencyName);
        const nodeModulePath = await maybeRealpath(originPath);
        if (nodeModulePath != null) {
          return {
            source: DependencyResolutionSource.RECURSIVE_RESOLUTION,
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
    })
  );

  return modules.filter((moduleEntry) => moduleEntry != null);
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

  const _visitedPackagePaths = new Set();
  const getNodeModulePaths = createNodeModulePathsCreator();
  const maxDepth = limitDepth != null ? limitDepth : MAX_DEPTH;
  const searchResults: ResolutionResult = Object.create(null);

  const recurseDependencies = async (parent: DependencyResolution): Promise<void> => {
    const nodeModulePaths = await getNodeModulePaths(parent.path);
    const packageJson = await loadPackageJson(fastJoin(parent.path, 'package.json'));
    if (!packageJson) {
      return;
    }
    parent.version = packageJson.version || '';
    const depth = parent.depth + 1;
    if (depth >= maxDepth) {
      return;
    }
    const resolutions = await resolveDependencies(
      packageJson,
      nodeModulePaths,
      depth,
      shouldIncludeDependency
    );
    const tasks: Promise<void>[] = [];
    for (let idx = 0; idx < resolutions.length; idx++) {
      const resolution = resolutions[idx];
      if (!_visitedPackagePaths.has(resolution.path)) {
        _visitedPackagePaths.add(resolution.path);
        const prevEntry = searchResults[resolution.name];
        if (prevEntry != null && resolution.path !== prevEntry.path) {
          searchResults[resolution.name] = mergeWithDuplicate(prevEntry, resolution);
        } else if (prevEntry == null) {
          searchResults[resolution.name] = resolution;
        }
        tasks.push(recurseDependencies(resolution));
      }
    }
    await Promise.all(tasks);
  };

  await recurseDependencies({
    source: DependencyResolutionSource.RECURSIVE_RESOLUTION,
    name: '',
    version: '',
    path: rootPath,
    originPath: rawPath,
    duplicates: null,
    depth: -1,
  });

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
