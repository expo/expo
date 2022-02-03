import { ModuleDescriptor, ResolveOptions, SearchResults } from '../types';
/**
 * Resolves search results to a list of platform-specific configuration.
 */
export declare function resolveModulesAsync(searchResults: SearchResults, options: ResolveOptions): Promise<ModuleDescriptor[]>;
