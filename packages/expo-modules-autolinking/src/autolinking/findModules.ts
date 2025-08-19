import { discoverExpoModuleConfigAsync } from '../ExpoModuleConfig';
import { AutolinkingOptions } from '../commands/autolinkingOptions';
import {
  type DependencyResolution,
  scanDependenciesRecursively,
  scanDependenciesInSearchPath,
  filterMapResolutionResult,
  mergeResolutionResults,
} from '../dependencies';
import { PackageRevision, SearchResults, SupportedPlatform } from '../types';

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

interface FindModulesParams {
  appRoot: string;
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform };
}

/** Searches for modules to link based on given config. */
export async function findModulesAsync({
  appRoot,
  autolinkingOptions,
}: FindModulesParams): Promise<SearchResults> {
  const excludeNames = new Set(autolinkingOptions.exclude);

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths = autolinkingOptions.nativeModulesDir
    ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
    : autolinkingOptions.searchPaths;

  return filterMapResolutionResult(
    mergeResolutionResults(
      await Promise.all([
        ...searchPaths.map((searchPath) => scanDependenciesInSearchPath(searchPath)),
        scanDependenciesRecursively(appRoot),
      ])
    ),
    (resolution) => resolveExpoModule(resolution, autolinkingOptions.platform, excludeNames)
  );
}
