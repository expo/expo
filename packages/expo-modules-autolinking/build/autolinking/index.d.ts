import { findModulesAsync } from './findModules';
import { getProjectPackageJsonPathAsync, mergeLinkingOptionsAsync, resolveSearchPathsAsync } from './mergeLinkingOptions';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';
import type { ModuleDescriptor, SearchOptions } from '../types';
export { findModulesAsync, getProjectPackageJsonPathAsync, mergeLinkingOptionsAsync, resolveExtraBuildDependenciesAsync, resolveModulesAsync, resolveSearchPathsAsync, };
export { generateModulesProviderAsync, generatePackageListAsync } from './generatePackageList';
export { verifySearchResults } from './verifySearchResults';
export * from '../types';
/**
 * Programmatic API to query autolinked modules for a project.
 */
export declare function queryAutolinkingModulesFromProjectAsync(projectRoot: string, options: Pick<SearchOptions, 'platform' | 'exclude' | 'onlyProjectDeps'>): Promise<ModuleDescriptor[]>;
/**
 * Get the project root directory from the current working directory.
 */
export declare function findProjectRootSync(cwd?: string): string;
