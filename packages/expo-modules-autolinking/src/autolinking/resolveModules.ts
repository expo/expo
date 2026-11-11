import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import { taskAll } from '../concurrency';
import { getLinkingImplementationForPlatform } from '../platforms';
import type {
  ExtraDependencies,
  ModuleDescriptor,
  SearchResults,
  SupportedPlatform,
} from '../types';

export type ResolveModulesParams = {
  /**
   * Whether to scan native sources for annotated module classes, on platforms that support it.
   * Only the modules provider generation asks for it.
   */
  scanNativeModules?: boolean;
  /** Called with whether the requested scan produced a result. */
  onScanResult?: (succeeded: boolean) => void;
  /** The platform to scan for, when narrower than the resolved one (the umbrella `apple`). */
  scanPlatform?: SupportedPlatform;
};

/** Resolves search results to a list of platform-specific configuration. */
export async function resolveModulesAsync(
  searchResults: SearchResults,
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform },
  { scanNativeModules = false, onScanResult, scanPlatform }: ResolveModulesParams = {}
): Promise<ModuleDescriptor[]> {
  const platformLinking = getLinkingImplementationForPlatform(autolinkingOptions.platform);
  // One scan for all packages, passed down through `extraOutput`. A failed scan never fails
  // resolution.
  let scannedModules = null;
  if (scanNativeModules && 'scanNativeModulesAsync' in platformLinking) {
    try {
      scannedModules = await platformLinking.scanNativeModulesAsync(
        searchResults,
        scanPlatform ?? autolinkingOptions.platform
      );
    } catch (error: any) {
      console.warn(
        `warning: Scanning for native modules failed, only modules declared in the module config will be linked: ${error.message ?? error}`
      );
    }
    onScanResult?.(scannedModules != null);
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
