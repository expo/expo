import { findModulesAsync } from './findModules';
import { mergeLinkingOptionsAsync, resolveSearchPathsAsync } from './mergeLinkingOptions';
import { resolveModulesAsync } from './resolveModules';
import type { ModuleDescriptor, SearchOptions } from '../types';

export { findModulesAsync, mergeLinkingOptionsAsync, resolveModulesAsync, resolveSearchPathsAsync };
export { generatePackageListAsync } from './generatePackageList';
export { verifySearchResults } from './verifySearchResults';
export * from '../types';

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
