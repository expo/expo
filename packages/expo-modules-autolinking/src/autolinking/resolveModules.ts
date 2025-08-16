import { getLinkingImplementationForPlatform } from './utils';
import { AutolinkingOptions } from '../commands/autolinkingOptions';
import type {
  ExtraDependencies,
  ModuleDescriptor,
  SearchResults,
  SupportedPlatform,
} from '../types';

interface ResolveModulesParams {
  appRoot: string;
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform };
}

/** Resolves search results to a list of platform-specific configuration. */
export async function resolveModulesAsync(
  searchResults: SearchResults,
  { appRoot, autolinkingOptions }: ResolveModulesParams
): Promise<ModuleDescriptor[]> {
  const platformLinking = getLinkingImplementationForPlatform(autolinkingOptions.platform);

  return (
    await Promise.all(
      Object.entries(searchResults).map(async ([packageName, revision]) => {
        const resolvedModule = await platformLinking.resolveModuleAsync(
          packageName,
          revision,
          autolinkingOptions // TODO: Unclear what's needed here: untyped!
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
