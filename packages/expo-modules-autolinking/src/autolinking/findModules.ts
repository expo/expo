import { discoverExpoModuleConfigAsync } from '../ExpoModuleConfig';
import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import {
  type DependencyResolution,
  scanDependenciesRecursively,
  scanDependenciesInSearchPath,
  filterMapResolutionResult,
  mergeResolutionResults,
} from '../dependencies';
import { createMemoizer } from '../memoize';
import type { PackageRevision, SearchResults, SupportedPlatform } from '../types';
import { maybeRealpath } from '../utils';

export async function resolveExpoModule(
  resolution: DependencyResolution,
  platform: SupportedPlatform,
  excludeNames: Set<string>
): Promise<PackageRevision | null> {
  if (excludeNames.has(resolution.name)) {
    return null;
  }

  // Workaround for Android Gradle/Prefab issue with special characters in paths.
  // pnpm creates virtual store paths with '=' characters (e.g., _patch_hash=abc123),
  // which cause build failures on Android due to Prefab not properly escaping them.
  // See: https://github.com/google/prefab/issues/187
  const shouldUseOriginPath =
    platform === 'android' && resolution.path.includes('=') && resolution.path.includes('.pnpm');
  const modulePath = shouldUseOriginPath ? resolution.originPath : resolution.path;

  const expoModuleConfig = await discoverExpoModuleConfigAsync(modulePath);
  if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
    return {
      name: resolution.name,
      path: modulePath,
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
  const memoizer = createMemoizer();
  const excludeNames = new Set(autolinkingOptions.exclude);

  const nativeModulesDir = autolinkingOptions.nativeModulesDir
    ? await maybeRealpath(autolinkingOptions.nativeModulesDir)
    : null;
  // Paths of the local modules: the packages that the `nativeModulesDir` scan finds. When
  // `nativeModulesDir` is a package itself (create-expo-module's example app sets it to `../`),
  // that package keeps its own name, so it isn't a local module.
  const localModulePaths = new Set<string>();

  const searchResults = await memoizer.withMemoizer(async () => {
    // custom native modules should be resolved first so that they can override other modules
    const nativeModulesResolutions = autolinkingOptions.nativeModulesDir
      ? await scanDependenciesInSearchPath(autolinkingOptions.nativeModulesDir)
      : {};
    for (const resolution of Object.values(nativeModulesResolutions)) {
      if (resolution && resolution.path !== nativeModulesDir) {
        localModulePaths.add(resolution.path);
        localModulePaths.add(resolution.originPath);
      }
    }
    return filterMapResolutionResult(
      mergeResolutionResults(
        await Promise.all([
          nativeModulesResolutions,
          ...autolinkingOptions.searchPaths.map((searchPath) =>
            scanDependenciesInSearchPath(searchPath)
          ),
          scanDependenciesRecursively(appRoot),
        ])
      ),
      (resolution) => resolveExpoModule(resolution, autolinkingOptions.platform, excludeNames)
    );
  });

  for (const revision of Object.values(searchResults)) {
    if (localModulePaths.has(revision.path)) {
      revision.isLocal = true;
    }
  }
  return searchResults;
}
