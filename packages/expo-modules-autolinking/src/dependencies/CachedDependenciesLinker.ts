import fs from 'fs';

import { PackageRevision, SupportedPlatform } from '../types';
import { scanDependenciesRecursively } from './resolution';
import { scanDependenciesFromRNProjectConfig } from './rncliLocal';
import { scanDependenciesInSearchPath } from './scanning';
import { type ResolutionResult, DependencyResolutionSource } from './types';
import { filterMapResolutionResult, mergeResolutionResults } from './utils';
import { resolveExpoModule } from '../autolinking/findModules';
import { AutolinkingOptions, createAutolinkingOptionsLoader } from '../commands/autolinkingOptions';
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
  const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
    projectRoot: params.projectRoot,
  });

  let appRoot: Promise<string> | undefined;
  const getAppRoot = () => appRoot || (appRoot = autolinkingOptionsLoader.getAppRoot());

  const dependenciesResultBySearchPath = new Map<string, Promise<ResolutionResult>>();
  let reactNativeProjectConfig: Promise<RNConfigReactNativeProjectConfig | null> | undefined;
  let reactNativeProjectConfigDependencies: Promise<ResolutionResult> | undefined;
  let recursiveDependencies: Promise<ResolutionResult> | undefined;

  return {
    async getOptionsForPlatform(platform) {
      const options = await autolinkingOptionsLoader.getPlatformOptions(platform);
      return makeCachedDependenciesSearchOptions(options);
    },
    async loadReactNativeProjectConfig() {
      if (reactNativeProjectConfig === undefined) {
        reactNativeProjectConfig = loadConfigAsync(
          await getAppRoot()
        ) as Promise<RNConfigReactNativeProjectConfig>;
      }
      return reactNativeProjectConfig;
    },
    async scanDependenciesFromRNProjectConfig() {
      const reactNativeProjectConfig = await this.loadReactNativeProjectConfig();
      return (
        reactNativeProjectConfigDependencies ||
        (reactNativeProjectConfigDependencies = scanDependenciesFromRNProjectConfig(
          await getAppRoot(),
          reactNativeProjectConfig
        ))
      );
    },
    async scanDependenciesRecursively() {
      return (
        recursiveDependencies ||
        (recursiveDependencies = scanDependenciesRecursively(await getAppRoot()))
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

export async function scanExpoModuleResolutionsForPlatform(
  linker: CachedDependenciesLinker,
  platform: SupportedPlatform
): Promise<Record<string, PackageRevision>> {
  const { excludeNames, searchPaths } = await linker.getOptionsForPlatform(platform);
  const resolutions = mergeResolutionResults(
    await Promise.all(
      [
        ...searchPaths.map((searchPath) => {
          return linker.scanDependenciesInSearchPath(searchPath);
        }),
        linker.scanDependenciesRecursively(),
      ].filter((x) => x != null)
    )
  );
  return await filterMapResolutionResult(resolutions, async (resolution) => {
    return !excludeNames.has(resolution.name)
      ? await resolveExpoModule(resolution, platform, excludeNames)
      : null;
  });
}

const makeCachedDependenciesSearchOptions = (options: AutolinkingOptions) => ({
  excludeNames: new Set(options.exclude),
  searchPaths:
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
      : (options.searchPaths ?? []),
});
