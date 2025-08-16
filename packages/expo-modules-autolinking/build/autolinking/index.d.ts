import { AutolinkingOptions } from '../commands/autolinkingOptions';
import { ExtraDependencies, ModuleDescriptor, SearchResults, SupportedPlatform } from '../types';
export { getConfiguration } from './getConfiguration';
export { generateModulesProviderAsync, generatePackageListAsync } from './generatePackageList';
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
declare function apiFindModulesAsync(providedOptions: SearchOptions): Promise<SearchResults>;
/** @deprecated */
declare function apiResolveExtraBuildDependenciesAsync(providedOptions: ResolveOptions): Promise<ExtraDependencies>;
/** @deprecated */
declare function apiResolveModulesAsync(searchResults: SearchResults, providedOptions: SearchOptions): Promise<ModuleDescriptor[]>;
export { apiFindModulesAsync as findModulesAsync, apiResolveExtraBuildDependenciesAsync as resolveExtraBuildDependenciesAsync, apiResolveModulesAsync as resolveModulesAsync, };
