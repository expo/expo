import { findModulesAsync } from './findModules';
import { mergeLinkingOptionsAsync, resolveSearchPathsAsync } from './mergeLinkingOptions';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';
import type { ModuleDescriptor, SearchOptions } from '../types';
export { findModulesAsync, mergeLinkingOptionsAsync, resolveExtraBuildDependenciesAsync, resolveModulesAsync, resolveSearchPathsAsync, };
export { generatePackageListAsync } from './generatePackageList';
export { verifySearchResults } from './verifySearchResults';
export * from '../types';
/**
 * Programmatic API to query autolinked modules for a project.
 */
export declare function queryAutolinkingModulesFromProjectAsync(projectRoot: string, options: Pick<SearchOptions, 'platform' | 'exclude' | 'onlyProjectDeps'>): Promise<ModuleDescriptor[]>;
