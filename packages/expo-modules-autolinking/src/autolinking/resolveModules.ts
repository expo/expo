import { getLinkingImplementationForPlatform } from './utils';
import type { ExtraDependencies, ModuleDescriptor, ResolveOptions, SearchResults } from '../types';

/**
 * Resolves search results to a list of platform-specific configuration.
 */
export async function resolveModulesAsync(
  searchResults: SearchResults,
  options: ResolveOptions
): Promise<ModuleDescriptor[]> {
  const platformLinking = getLinkingImplementationForPlatform(options.platform);

  return (
    await Promise.all(
      Object.entries(searchResults).map(async ([packageName, revision]) => {
        const resolvedModule = await platformLinking.resolveModuleAsync(
          packageName,
          revision,
          options
        );
        return resolvedModule
          ? {
              packageName,
              packageVersion: revision.version,
              ...resolvedModule,
            }
          : null;
      })
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.packageName.localeCompare(b.packageName));
}

/**
 * Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods.
 */
export async function resolveExtraBuildDependenciesAsync(
  options: ResolveOptions
): Promise<ExtraDependencies> {
  const platformLinking = getLinkingImplementationForPlatform(options.platform);
  const extraDependencies = await platformLinking.resolveExtraBuildDependenciesAsync(
    options.projectRoot
  );
  return extraDependencies ?? [];
}
