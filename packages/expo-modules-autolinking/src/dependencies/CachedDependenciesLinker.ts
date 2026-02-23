import fs from 'fs';

import { PackageRevision, SupportedPlatform } from '../types';
import { scanDependenciesRecursively } from './resolution';
import { scanDependenciesFromRNProjectConfig } from './rncliLocal';
import { scanDependenciesInSearchPath } from './scanning';
import { type ResolutionResult, DependencyResolutionSource } from './types';
import { filterMapResolutionResult, mergeResolutionResults } from './utils';
import { resolveExpoModule } from '../autolinking/findModules';
import { AutolinkingOptions, createAutolinkingOptionsLoader } from '../commands/autolinkingOptions';
import { createMemoizer, type Memoizer } from '../memoize';
import { resolveReactNativeModule, RNConfigReactNativeProjectConfig } from '../reactNativeConfig';
import { loadConfigAsync } from '../reactNativeConfig/config';

export interface CachedDependenciesSearchOptions {
  excludeNames: Set<string>;
  searchPaths: string[];
}

export interface CachedDependenciesLinker {
  memoizer: Memoizer;
  getOptionsForPlatform(platform: SupportedPlatform): Promise<CachedDependenciesSearchOptions>;
  loadReactNativeProjectConfig(): Promise<RNConfigReactNativeProjectConfig | null>;
  scanDependenciesFromRNProjectConfig(): Promise<ResolutionResult>;
  scanDependenciesRecursively(): Promise<ResolutionResult>;
  scanDependenciesInSearchPath(searchPath: string): Promise<ResolutionResult>;
}

export function makeCachedDependenciesLinker(params: {
  projectRoot: string;
}): CachedDependenciesLinker {
  const memoizer = createMemoizer();

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
    memoizer,
    async getOptionsForPlatform(platform) {
      const options = await autolinkingOptionsLoader.getPlatformOptions(platform);
      return makeCachedDependenciesSearchOptions(options);
    },
    async loadReactNativeProjectConfig() {
      if (reactNativeProjectConfig === undefined) {
        reactNativeProjectConfig = memoizer.call(
          loadConfigAsync,
          await getAppRoot()
        ) as Promise<RNConfigReactNativeProjectConfig | null>;
      }
      return reactNativeProjectConfig;
    },
    async scanDependenciesFromRNProjectConfig() {
      if (reactNativeProjectConfigDependencies === undefined) {
        reactNativeProjectConfigDependencies = memoizer.withMemoizer(async () => {
          return await scanDependenciesFromRNProjectConfig(
            await getAppRoot(),
            await this.loadReactNativeProjectConfig()
          );
        });
      }
      return reactNativeProjectConfigDependencies;
    },
    async scanDependenciesRecursively() {
      if (recursiveDependencies === undefined) {
        recursiveDependencies = memoizer.withMemoizer(async () => {
          return scanDependenciesRecursively(await getAppRoot());
        });
      }
      return recursiveDependencies;
    },
    async scanDependenciesInSearchPath(searchPath: string) {
      let result = dependenciesResultBySearchPath.get(searchPath);
      if (!result) {
        dependenciesResultBySearchPath.set(
          searchPath,
          (result = memoizer.withMemoizer(scanDependenciesInSearchPath, searchPath))
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

  return await linker.memoizer.withMemoizer(async () => {
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
  });
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
  return await linker.memoizer.withMemoizer(async () => {
    return await filterMapResolutionResult(resolutions, async (resolution) => {
      return !excludeNames.has(resolution.name)
        ? await resolveExpoModule(resolution, platform, excludeNames)
        : null;
    });
  });
}

const makeCachedDependenciesSearchOptions = (options: AutolinkingOptions) => ({
  excludeNames: new Set(options.exclude),
  searchPaths:
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
      : (options.searchPaths ?? []),
});
