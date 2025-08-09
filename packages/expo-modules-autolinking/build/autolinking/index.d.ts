import { findModulesAsync } from './findModules';
import { getProjectPackageJsonPathAsync, mergeLinkingOptionsAsync } from './mergeLinkingOptions';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';
import type { ModuleDescriptor, SearchOptions } from '../types';
import { getConfiguration } from './getConfiguration';
export { findModulesAsync, getProjectPackageJsonPathAsync, mergeLinkingOptionsAsync, resolveExtraBuildDependenciesAsync, resolveModulesAsync, getConfiguration, };
export { generateModulesProviderAsync, generatePackageListAsync } from './generatePackageList';
export { verifySearchResults } from './verifySearchResults';
export * from '../types';
export declare function resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
/**
 * Programmatic API to query autolinked modules for a project.
 */
export declare function queryAutolinkingModulesFromProjectAsync(projectRoot: string, options: Pick<SearchOptions, 'platform' | 'exclude' | 'onlyProjectDeps'>): Promise<ModuleDescriptor[]>;
/**
 * Get the project root directory from the current working directory.
 */
export declare function findProjectRootSync(cwd?: string): string;
