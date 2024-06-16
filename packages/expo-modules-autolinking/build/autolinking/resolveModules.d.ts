import type { ExtraDependencies, ModuleDescriptor, ResolveOptions, SearchResults } from '../types';
/**
 * Resolves search results to a list of platform-specific configuration.
 */
export declare function resolveModulesAsync(searchResults: SearchResults, options: ResolveOptions): Promise<ModuleDescriptor[]>;
/**
 * Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods.
 */
export declare function resolveExtraBuildDependenciesAsync(options: ResolveOptions): Promise<ExtraDependencies>;
