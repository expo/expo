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
import { isPathInside, maybeRealpath } from '../utils';
import type { PackageRevision, SearchResults, SupportedPlatform } from '../types';

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

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths = autolinkingOptions.nativeModulesDir
    ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
    : autolinkingOptions.searchPaths;

  const nativeModulesDir = autolinkingOptions.nativeModulesDir
    ? await maybeRealpath(autolinkingOptions.nativeModulesDir)
    : null;

  const searchResults = await memoizer.withMemoizer(async () => {
    return filterMapResolutionResult(
      mergeResolutionResults(
        await Promise.all([
          ...searchPaths.map((searchPath) => scanDependenciesInSearchPath(searchPath)),
          scanDependenciesRecursively(appRoot),
        ])
      ),
      (resolution) => resolveExpoModule(resolution, autolinkingOptions.platform, excludeNames)
    );
  });

  if (nativeModulesDir) {
    for (const revision of Object.values(searchResults)) {
      // `isPathInside` is false for `nativeModulesDir` itself, which is a package when
      // create-expo-module's example app sets it to `../`. That package keeps its own name.
      if (isPathInside(revision.path, nativeModulesDir)) {
        revision.isLocal = true;
      }
    }
  }
  return searchResults;
}
