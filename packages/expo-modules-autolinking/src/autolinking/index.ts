import path from 'path';

import { findModulesAsync } from './findModules';
import {
  getProjectPackageJsonPathAsync,
  getProjectPackageJsonPathSync,
  mergeLinkingOptionsAsync,
  resolveSearchPaths,
} from './mergeLinkingOptions';
import { resolveExtraBuildDependenciesAsync, resolveModulesAsync } from './resolveModules';
import type { ModuleDescriptor, SearchOptions } from '../types';
import { getConfiguration } from './getConfiguration';

export {
  findModulesAsync,
  getProjectPackageJsonPathAsync,
  mergeLinkingOptionsAsync,
  resolveExtraBuildDependenciesAsync,
  resolveModulesAsync,
  getConfiguration,
};
export { generateModulesProviderAsync, generatePackageListAsync } from './generatePackageList';
export { verifySearchResults } from './verifySearchResults';
export * from '../types';

export async function resolveSearchPathsAsync(
  searchPaths: string[] | null,
  cwd: string
): Promise<string[]> {
  return resolveSearchPaths(searchPaths, cwd);
}

/**
 * Programmatic API to query autolinked modules for a project.
 */
export async function queryAutolinkingModulesFromProjectAsync(
  projectRoot: string,
  options: Pick<SearchOptions, 'platform' | 'exclude' | 'onlyProjectDeps'>
): Promise<ModuleDescriptor[]> {
  const searchPaths = await resolveSearchPathsAsync(null, projectRoot);
  const linkOptions = await mergeLinkingOptionsAsync({ ...options, projectRoot, searchPaths });
  const searchResults = await findModulesAsync(linkOptions);
  return await resolveModulesAsync(searchResults, linkOptions);
}

/**
 * Get the project root directory from the current working directory.
 */
export function findProjectRootSync(cwd: string = process.cwd()): string {
  return path.dirname(getProjectPackageJsonPathSync(cwd));
}
