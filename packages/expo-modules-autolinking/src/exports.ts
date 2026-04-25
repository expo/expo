import fs from 'fs';
import path from 'path';

import { findModulesAsync } from './autolinking/findModules';
import { resolveModulesAsync } from './autolinking/resolveModules';
import type { AutolinkingCommonArguments, AutolinkingOptions } from './commands/autolinkingOptions';
import {
  createAutolinkingOptionsLoader,
  filterMapSearchPaths,
} from './commands/autolinkingOptions';
import type { ModuleDescriptor, SupportedPlatform } from './types';

export * from './types';
export * from './autolinking';
export * from './platforms';

export {
  type ResolutionResult,
  type BaseDependencyResolution,
  type DependencyResolution,
  type DependencyResolutionSource,
  type CachedDependenciesLinker,
  type CachedDependenciesSearchOptions,
  makeCachedDependenciesLinker,
  scanDependencyResolutionsForPlatform,
  scanExpoModuleResolutionsForPlatform,
} from './dependencies';

export * from './utilities';

/** @deprecated */
export async function mergeLinkingOptionsAsync<Options extends Partial<AutolinkingCommonArguments>>(
  argumentsOptions: Options
): Promise<Options & AutolinkingOptions> {
  const autolinkingOptionsLoader = createAutolinkingOptionsLoader(argumentsOptions);
  return {
    ...argumentsOptions,
    ...(await autolinkingOptionsLoader.getPlatformOptions()),
    projectRoot: autolinkingOptionsLoader.getAppRoot(),
  };
}

interface QueryAutolinkingModulesFromProjectParams extends Partial<AutolinkingCommonArguments> {
  platform: SupportedPlatform;
  [extra: string]: unknown;
}

/** @deprecated */
export async function queryAutolinkingModulesFromProjectAsync(
  projectRoot: string,
  options: QueryAutolinkingModulesFromProjectParams
): Promise<ModuleDescriptor[]> {
  const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
    ...options,
    // NOTE(@kitten): This has always been duplicated
    projectRoot: options.projectRoot ?? projectRoot,
  });
  const appRoot = await autolinkingOptionsLoader.getAppRoot();
  const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(options.platform);
  const searchResults = await findModulesAsync({ appRoot, autolinkingOptions });
  return await resolveModulesAsync(searchResults, autolinkingOptions);
}

/** @deprecated */
export function findProjectRootSync(cwd: string = process.cwd()): string {
  for (let dir = cwd; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, 'package.json');
    if (fs.existsSync(file)) {
      return file;
    }
  }
  throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
}

/** @deprecated */
export async function resolveSearchPathsAsync(
  searchPaths: string[] | null,
  cwd: string
): Promise<string[]> {
  return filterMapSearchPaths(searchPaths, cwd) ?? [];
}
