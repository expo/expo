import fs from 'fs';

import { SearchOptions, SupportedPlatform } from '../autolinking';
import { scanDependenciesRecursively } from './resolution';
import { scanDependenciesFromRNProjectConfig } from './rncliLocal';
import { scanDependenciesInSearchPath } from './scanning';
import { type ResolutionResult, DependencyResolutionSource } from './types';
import { filterMapResolutionResult, mergeResolutionResults } from './utils';
import { resolveExpoModule } from '../autolinking/findModules';
import { createLinkingOptionsFactory } from '../autolinking/mergeLinkingOptions';
import { resolveReactNativeModule, RNConfigReactNativeProjectConfig } from '../reactNativeConfig';
import { loadConfigAsync } from '../reactNativeConfig/config';

export interface CachedDependenciesSearchOptions {
  excludeNames: Set<string>;
  searchPaths: string[];
}

export interface CachedDependenciesLinker {
  getOptionsForPlatform(platform: SupportedPlatform): Promise<CachedDependenciesSearchOptions>;
  loadReactNativeProjectConfig(): Promise<RNConfigReactNativeProjectConfig | null>;
  scanDependenciesFromRNProjectConfig(): Promise<ResolutionResult>;
  scanDependenciesRecursively(): Promise<ResolutionResult>;
  scanDependenciesInSearchPath(searchPath: string): Promise<ResolutionResult>;
}

export function makeCachedDependenciesLinker(params: {
  projectRoot: string;
}): CachedDependenciesLinker {
  const linkingOptionsFactory = createLinkingOptionsFactory<SearchOptions>({
    projectRoot: params.projectRoot,
    platform: 'apple', // Placeholder value
  });

  let projectRoot: Promise<string> | undefined;
  const getProjectRoot = () =>
    projectRoot || (projectRoot = linkingOptionsFactory.getProjectRoot());

  const dependenciesResultBySearchPath = new Map<string, Promise<ResolutionResult>>();
  let reactNativeProjectConfig: Promise<RNConfigReactNativeProjectConfig | null> | undefined;
  let reactNativeProjectConfigDependencies: Promise<ResolutionResult> | undefined;
  let recursiveDependencies: Promise<ResolutionResult> | undefined;

  return {
    async getOptionsForPlatform(platform) {
      const options = await linkingOptionsFactory.getPlatformOptions(platform);
      return makeCachedDependenciesSearchOptions(options);
    },
    async loadReactNativeProjectConfig() {
      if (reactNativeProjectConfig === undefined) {
        reactNativeProjectConfig = loadConfigAsync<RNConfigReactNativeProjectConfig>(
          await getProjectRoot()
        );
      }
      return reactNativeProjectConfig;
    },
    async scanDependenciesFromRNProjectConfig() {
      const reactNativeProjectConfig = await this.loadReactNativeProjectConfig();
      return (
        reactNativeProjectConfigDependencies ||
        (reactNativeProjectConfigDependencies = scanDependenciesFromRNProjectConfig(
          await getProjectRoot(),
          reactNativeProjectConfig
        ))
      );
    },
    async scanDependenciesRecursively() {
      return (
        recursiveDependencies ||
        (recursiveDependencies = scanDependenciesRecursively(await getProjectRoot()))
      );
    },
    async scanDependenciesInSearchPath(searchPath: string) {
      let result = dependenciesResultBySearchPath.get(searchPath);
      if (!result) {
        dependenciesResultBySearchPath.set(
          searchPath,
          (result = scanDependenciesInSearchPath(searchPath))
        );
      }
      return result;
    },
  };
}

export async function scanDependencyResolutionsForPlatform(
  linker: CachedDependenciesLinker,
  platform: SupportedPlatform,
  include?: string[]
): Promise<ResolutionResult> {
  const { excludeNames, searchPaths } = await linker.getOptionsForPlatform(platform);
  const includeNames = new Set(include);
  const reactNativeProjectConfig = await linker.loadReactNativeProjectConfig();

  const resolutions = mergeResolutionResults(
    await Promise.all([
      linker.scanDependenciesFromRNProjectConfig(),
      ...searchPaths.map((searchPath) => {
        return linker.scanDependenciesInSearchPath(searchPath);
      }),
      linker.scanDependenciesRecursively(),
    ])
  );

  const dependencies = await filterMapResolutionResult(resolutions, async (resolution) => {
    if (excludeNames.has(resolution.name)) {
      return null;
    } else if (includeNames.has(resolution.name)) {
      return resolution;
    } else if (resolution.source === DependencyResolutionSource.RN_CLI_LOCAL) {
      // If the dependency was resolved frpom the React Native project config, we'll only
      // attempt to resolve it as a React Native module
      const reactNativeModuleDesc = await resolveReactNativeModule(
        resolution,
        reactNativeProjectConfig,
        platform,
        excludeNames
      );
      if (!reactNativeModuleDesc) {
        return null;
      }
    } else {
      const [reactNativeModule, expoModule] = await Promise.all([
        resolveReactNativeModule(resolution, reactNativeProjectConfig, platform, excludeNames),
        resolveExpoModule(resolution, platform, excludeNames),
      ]);
      if (!reactNativeModule && !expoModule) {
        return null;
      }
    }
    return resolution;
  });

  return dependencies;
}

const makeCachedDependenciesSearchOptions = (options: SearchOptions) => ({
  excludeNames: new Set(options.exclude),
  searchPaths:
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
      : (options.searchPaths ?? []),
});
