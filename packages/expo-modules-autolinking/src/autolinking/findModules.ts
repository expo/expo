import fs from 'fs';
import path from 'path';

import { mergeLinkingOptionsAsync } from './mergeLinkingOptions';
import { ExpoModuleConfig, loadExpoModuleConfigAsync } from '../ExpoModuleConfig';
import {
  type DependencyResolution,
  scanDependenciesRecursively,
  scanDependenciesInSearchPath,
  filterMapResolutionResult,
  mergeResolutionResults,
} from '../dependencies';
import { PackageRevision, SearchOptions, SearchResults, SupportedPlatform } from '../types';

/** Names of Expo Module config files (highest to lowest priority) */
const EXPO_MODULE_CONFIG_FILENAMES = ['expo-module.config.json', 'unimodule.json'];

async function resolveExpoModule(
  resolution: DependencyResolution,
  platform: SupportedPlatform,
  excludeNames: Set<string>
): Promise<PackageRevision | null> {
  if (excludeNames.has(resolution.name)) {
    return null;
  }
  let expoModuleConfig: ExpoModuleConfig | null = null;
  for (let idx = 0; idx < EXPO_MODULE_CONFIG_FILENAMES.length; idx++) {
    try {
      expoModuleConfig = await loadExpoModuleConfigAsync(
        path.join(resolution.path, EXPO_MODULE_CONFIG_FILENAMES[idx])
      );
      break;
    } catch {
      // try the next file
    }
  }
  if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
    return {
      name: resolution.name,
      path: resolution.path,
      version: resolution.version,
      config: expoModuleConfig,
      duplicates:
        resolution.duplicates?.map((duplicate) => ({
          name: resolution.name,
          path: duplicate,
          version: '', // NOTE: Are we actually using this?
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
