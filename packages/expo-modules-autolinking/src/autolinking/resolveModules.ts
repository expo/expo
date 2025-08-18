import { AutolinkingOptions } from '../commands/autolinkingOptions';
import { getLinkingImplementationForPlatform } from '../platforms';
import type {
  ExtraDependencies,
  ModuleDescriptor,
  SearchResults,
  SupportedPlatform,
} from '../types';

/** Resolves search results to a list of platform-specific configuration. */
export async function resolveModulesAsync(
  searchResults: SearchResults,
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform }
): Promise<ModuleDescriptor[]> {
  const platformLinking = getLinkingImplementationForPlatform(autolinkingOptions.platform);
  // Additional output property for Cocoapods flags
  const extraOutput = { flags: autolinkingOptions.flags };

  const moduleDescriptorList = await Promise.all(
    Object.entries(searchResults).map(async ([packageName, revision]) => {
      const resolvedModule = await platformLinking.resolveModuleAsync(
        packageName,
        revision,
        extraOutput
      );
      return resolvedModule
        ? {
            ...resolvedModule,
            packageVersion: revision.version,
            packageName: resolvedModule.packageName ?? packageName,
          }
        : null;
    })
  );

  return moduleDescriptorList
    .filter((moduleDescriptor) => moduleDescriptor != null)
    .sort((a, b) => a.packageName.localeCompare(b.packageName));
}

interface ResolveExtraBuildDependenciesParams {
  commandRoot: string;
  platform: SupportedPlatform;
}

/** Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods. */
export async function resolveExtraBuildDependenciesAsync({
  commandRoot,
  platform,
}: ResolveExtraBuildDependenciesParams): Promise<ExtraDependencies> {
  const platformLinking = getLinkingImplementationForPlatform(platform);
  const extraDependencies = await platformLinking.resolveExtraBuildDependenciesAsync(
    // NOTE: We assume we must be inside the native folder here
    // The `resolve` command either is invoked in the CWD of `./{android,ios}` or has a `--project-root`
    // that's in the native directory
    commandRoot
  );
  return extraDependencies ?? [];
}
