import fs from 'fs';

import {
  type ResolutionResult,
  type DependencyResolution,
  DependencyResolutionSource,
} from './types';
import { defaultShouldIncludeDependency, loadPackageJson, maybeRealpath, fastJoin } from './utils';

async function resolveDependency(
  basePath: string,
  dependencyName: string,
  shouldIncludeDependency: (dependencyName: string) => boolean
): Promise<DependencyResolution | null> {
  if (!shouldIncludeDependency(dependencyName)) {
    return null;
  }
  const originPath = fastJoin(basePath, dependencyName);
  const realPath = await maybeRealpath(originPath);
  const packageJson = await loadPackageJson(fastJoin(realPath || originPath, 'package.json'));
  if (packageJson) {
    return {
      source: DependencyResolutionSource.SEARCH_PATH,
      name: packageJson.name,
      version: packageJson.version || '',
      path: realPath || originPath,
      originPath,
      duplicates: null,
      depth: 0,
    };
  } else if (realPath) {
    return {
      source: DependencyResolutionSource.SEARCH_PATH,
      name: dependencyName.toLowerCase(),
      version: '',
      path: realPath,
      originPath,
      duplicates: null,
      depth: 0,
    };
  } else {
    return null;
  }
}

interface ResolutionOptions {
  shouldIncludeDependency?(name: string): boolean;
}

export async function scanDependenciesInSearchPath(
  rawPath: string,
  { shouldIncludeDependency = defaultShouldIncludeDependency }: ResolutionOptions = {}
): Promise<ResolutionResult> {
  const rootPath = await maybeRealpath(rawPath);
  const searchResults: ResolutionResult = Object.create(null);
  if (!rootPath) {
    return searchResults;
  }

  const resolvedDependencies: DependencyResolution[] = [];
  const dirents = await fs.promises.readdir(rootPath!, { withFileTypes: true });

  await Promise.all(
    dirents.map(async (entry) => {
      if (entry.isSymbolicLink()) {
        const resolution = await resolveDependency(rootPath, entry.name, shouldIncludeDependency);
        if (resolution) resolvedDependencies.push(resolution);
      } else if (entry.isDirectory()) {
        if (entry.name === 'node_modules') {
          // Ignore nested node_modules folder
        }
        if (entry.name[0] === '.') {
          // Ignore hidden folders
        } else if (entry.name[0] === '@') {
          // NOTE: We don't expect @-scope folders to be symlinks
          const entryPath = fastJoin(rootPath, entry.name);
          const childEntries = await fs.promises.readdir(entryPath, { withFileTypes: true });
          await Promise.all(
            childEntries.map(async (child) => {
              const dependencyName = `${entry.name}/${child.name}`;
              if (child.isDirectory() || child.isSymbolicLink()) {
                const resolution = await resolveDependency(
                  rootPath,
                  dependencyName,
                  shouldIncludeDependency
                );
                if (resolution) resolvedDependencies.push(resolution);
              }
            })
          );
        } else {
          const resolution = await resolveDependency(rootPath, entry.name, shouldIncludeDependency);
          if (resolution) resolvedDependencies.push(resolution);
        }
      }
    })
  );

  for (let idx = 0; idx < resolvedDependencies.length; idx++) {
    const resolution = resolvedDependencies[idx];
    const prevEntry = searchResults[resolution.name];
    if (prevEntry != null && resolution.path !== prevEntry.path) {
      (prevEntry.duplicates ?? (prevEntry.duplicates = [])).push({
        name: resolution.name,
        version: resolution.version,
        path: resolution.path,
        originPath: resolution.originPath,
      });
    } else if (prevEntry == null) {
      searchResults[resolution.name] = resolution;
    }
  }

  return searchResults;
}
