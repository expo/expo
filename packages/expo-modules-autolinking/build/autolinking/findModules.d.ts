import { type DependencyResolution } from '../dependencies';
import { PackageRevision, SearchOptions, SearchResults, SupportedPlatform } from '../types';
export declare function resolveExpoModule(resolution: DependencyResolution, platform: SupportedPlatform, excludeNames: Set<string>): Promise<PackageRevision | null>;
/**
 * Searches for modules to link based on given config.
 */
export declare function findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults>;
