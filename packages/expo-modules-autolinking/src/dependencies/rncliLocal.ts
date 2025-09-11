import path from 'path';

import { DependencyResolutionSource, type ResolutionResult } from './types';
import { defaultShouldIncludeDependency, maybeRealpath } from './utils';
import { RNConfigReactNativeProjectConfig } from '../reactNativeConfig';

interface ResolutionOptions {
  shouldIncludeDependency?(name: string): boolean;
}

export async function scanDependenciesFromRNProjectConfig(
  rawPath: string,
  projectConfig: RNConfigReactNativeProjectConfig | null,
  { shouldIncludeDependency = defaultShouldIncludeDependency }: ResolutionOptions = {}
): Promise<ResolutionResult> {
  const rootPath = await maybeRealpath(rawPath);
  const searchResults: ResolutionResult = Object.create(null);
  if (!rootPath || !projectConfig || !projectConfig.dependencies) {
    return searchResults;
  }

  for (const dependencyName in projectConfig.dependencies) {
    if (!shouldIncludeDependency(dependencyName)) {
      continue;
    }
    const dependencyConfig = projectConfig.dependencies[dependencyName];
    if (dependencyConfig && dependencyConfig.root && typeof dependencyConfig.root === 'string') {
      const originPath = path.resolve(rootPath, dependencyConfig.root);
      const realPath = await maybeRealpath(originPath);
      if (realPath) {
        searchResults[dependencyName] = {
          source: DependencyResolutionSource.RN_CLI_LOCAL,
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
