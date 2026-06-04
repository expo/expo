import { findModulesAsync } from './findModules';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';
import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import { createAutolinkingOptionsLoader } from '../commands/autolinkingOptions';
import {
  makeCachedDependenciesLinker,
  scanDependencyResolutionsForPlatform,
} from '../dependencies';
import type {
  ExtraDependencies,
  ModuleDescriptor,
  SearchResults,
  SupportedPlatform,
} from '../types';

export { getConfiguration } from './getConfiguration';

/** @deprecated */
export interface SearchOptions extends Partial<AutolinkingOptions> {
  projectRoot: string;
  platform: SupportedPlatform;
  [extra: string]: unknown;
}

/** @deprecated */
export interface ResolveOptions {
  projectRoot: string;
  platform: SupportedPlatform;
  [extra: string]: unknown;
}

/** @deprecated */
async function apiFindModulesAsync(providedOptions: SearchOptions): Promise<SearchResults> {
  const autolinkingOptionsLoader = createAutolinkingOptionsLoader(providedOptions);
  return findModulesAsync({
    appRoot: await autolinkingOptionsLoader.getAppRoot(),
    autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(providedOptions.platform),
  });
}

/** @deprecated */
async function apiResolveExtraBuildDependenciesAsync(
  providedOptions: ResolveOptions
): Promise<ExtraDependencies> {
  return resolveExtraBuildDependenciesAsync({
    commandRoot: providedOptions.projectRoot,
    platform: providedOptions.platform,
  });
}

/** @deprecated */
async function apiResolveModulesAsync(
  searchResults: SearchResults,
  providedOptions: SearchOptions
): Promise<ModuleDescriptor[]> {
  const autolinkingOptionsLoader = createAutolinkingOptionsLoader(providedOptions);
  const appRoot = await autolinkingOptionsLoader.getAppRoot();
  const linker = makeCachedDependenciesLinker({ projectRoot: appRoot });
  // The RN-config resolver needs a concrete platform; map the `apple` umbrella to `ios`.
  const dependencyPlatform =
    providedOptions.platform === 'apple' ? 'ios' : providedOptions.platform;
  const dependencyResolutions = await scanDependencyResolutionsForPlatform(
    linker,
    dependencyPlatform
  );
  return resolveModulesAsync(
    searchResults,
    await autolinkingOptionsLoader.getPlatformOptions(providedOptions.platform),
    {
      resolvedDependencyNames: new Set(Object.keys(dependencyResolutions)),
      commandRoot: autolinkingOptionsLoader.getCommandRoot(),
    }
  );
}

export {
  apiFindModulesAsync as findModulesAsync,
  apiResolveExtraBuildDependenciesAsync as resolveExtraBuildDependenciesAsync,
  apiResolveModulesAsync as resolveModulesAsync,
};
