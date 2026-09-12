import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import { taskAll } from '../concurrency';
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
  // A platform implementation can scan all packages' native sources upfront (one pass for the
  // whole dependency tree); the per-package results are handed down through `extraOutput`.
  // Scanning is an enhancement over the config-declared modules, so a failure inside the scan must
  // never fail resolution itself.
  let scannedModules = null;
  if ('scanNativeModulesAsync' in platformLinking) {
    try {
      scannedModules = await platformLinking.scanNativeModulesAsync(searchResults);
    } catch (error: any) {
      console.warn(
        `⚠️  Scanning for native modules failed, only modules declared in the module config will be linked: ${error.message ?? error}`
      );
    }
  }
  // Additional output property for Cocoapods flags
  const extraOutput = { flags: autolinkingOptions.flags, scannedModules };

  const moduleDescriptorList = await taskAll(
    Object.entries(searchResults),
    async ([packageName, revision]) => {
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
    }
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
