import { findModulesAsync } from './findModules';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';
import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import { createAutolinkingOptionsLoader } from '../commands/autolinkingOptions';
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
  return resolveModulesAsync(
    searchResults,
    await autolinkingOptionsLoader.getPlatformOptions(providedOptions.platform)
  );
}

export {
  apiFindModulesAsync as findModulesAsync,
  apiResolveExtraBuildDependenciesAsync as resolveExtraBuildDependenciesAsync,
  apiResolveModulesAsync as resolveModulesAsync,
};
