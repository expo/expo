import { AutolinkingOptions } from '../commands/autolinkingOptions';
import { ExtraDependencies, ModuleDescriptor, SearchResults, SupportedPlatform } from '../types';
import { findModulesAsync } from './findModules';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';

export { getConfiguration } from './getConfiguration';
export { generateModulesProviderAsync, generatePackageListAsync } from './generatePackageList';

/** @deprecated */
export interface SearchOptions extends AutolinkingOptions {
  projectRoot: string;
  platform: SupportedPlatform;
}

/** @deprecated */
export interface ResolveOptions {
  projectRoot: string;
  platform: SupportedPlatform;
}

/** @deprecated */
async function apiFindModulesAsync(providedOptions: SearchOptions): Promise<SearchResults> {
  return findModulesAsync({
    appRoot: providedOptions.projectRoot,
    autolinkingOptions: providedOptions,
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
  return resolveModulesAsync(searchResults, providedOptions);
}

export {
  apiFindModulesAsync as findModulesAsync,
  apiResolveExtraBuildDependenciesAsync as resolveExtraBuildDependenciesAsync,
  apiResolveModulesAsync as resolveModulesAsync,
};
