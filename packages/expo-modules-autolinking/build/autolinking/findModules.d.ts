import { SearchOptions, SearchResults } from '../types';
/**
 * Searches for modules to link based on given config.
 */
export declare function findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults>;
