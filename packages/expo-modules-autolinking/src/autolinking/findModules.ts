import fs from 'fs';

import { mergeLinkingOptionsAsync } from './mergeLinkingOptions';
import { discoverExpoModuleConfigAsync } from '../ExpoModuleConfig';
import {
  type DependencyResolution,
  scanDependenciesRecursively,
  scanDependenciesInSearchPath,
  filterMapResolutionResult,
  mergeResolutionResults,
} from '../dependencies';
import { PackageRevision, SearchOptions, SearchResults, SupportedPlatform } from '../types';

export async function resolveExpoModule(
  resolution: DependencyResolution,
  platform: SupportedPlatform,
  excludeNames: Set<string>
): Promise<PackageRevision | null> {
  if (excludeNames.has(resolution.name)) {
    return null;
  }
  const expoModuleConfig = await discoverExpoModuleConfigAsync(resolution.path);
  if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
    return {
      name: resolution.name,
      path: resolution.path,
      version: resolution.version,
      config: expoModuleConfig,
      duplicates:
        resolution.duplicates?.map((duplicate) => ({
          name: duplicate.name,
          path: duplicate.path,
          version: duplicate.version,
        })) ?? [],
    };
  } else {
    return null;
  }
}

/**
 * Searches for modules to link based on given config.
 */
export async function findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults> {
  const options = await mergeLinkingOptionsAsync(providedOptions);
  const excludeNames = new Set(options.exclude);

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths =
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
      : (options.searchPaths ?? []);

  return filterMapResolutionResult(
    mergeResolutionResults(
      await Promise.all([
        ...searchPaths.map((searchPath) => scanDependenciesInSearchPath(searchPath)),
        scanDependenciesRecursively(options.projectRoot),
      ])
    ),
    (resolution) => resolveExpoModule(resolution, options.platform, excludeNames)
  );
}
