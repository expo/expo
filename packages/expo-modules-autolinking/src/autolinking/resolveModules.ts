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
   * Whether to scan the packages' native sources for annotated module classes, for the platforms
   * that support it. Only the modules provider generation needs the scanned classes, and it is the
   * step whose output they end up in, so it is the one place that asks for the scan. Resolution at
   * pod install deliberately skips it: its result would be baked into the generated build phase,
   * where a scan that failed once would keep a package unlinked until the next pod install.
   */
  scanNativeModules?: boolean;
  /**
   * Called with whether the scan produced a result, when one was asked for. A caller that expects
   * scanned classes uses it to tell a package that genuinely has nothing to link apart from one
   * whose classes went missing because the scan didn't run.
   */
  onScanResult?: (succeeded: boolean) => void;
};

/** Resolves search results to a list of platform-specific configuration. */
export async function resolveModulesAsync(
  searchResults: SearchResults,
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform },
  { scanNativeModules = false, onScanResult }: ResolveModulesParams = {}
): Promise<ModuleDescriptor[]> {
  const platformLinking = getLinkingImplementationForPlatform(autolinkingOptions.platform);
  // A platform implementation can scan all packages' native sources upfront (one pass for the
  // whole dependency tree); the per-package results are handed down through `extraOutput`.
  // Scanning is an enhancement over the config-declared modules, so a failure inside the scan must
  // never fail resolution itself.
  let scannedModules = null;
  if (scanNativeModules && 'scanNativeModulesAsync' in platformLinking) {
    try {
      scannedModules = await platformLinking.scanNativeModulesAsync(
        searchResults,
        autolinkingOptions.platform
      );
    } catch (error: any) {
      console.warn(
        `⚠️  Scanning for native modules failed, only modules declared in the module config will be linked: ${error.message ?? error}`
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
