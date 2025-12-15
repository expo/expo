import { AutolinkingOptions } from '../commands/autolinkingOptions';
import type { ExtraDependencies, ModuleDescriptor, SearchResults, SupportedPlatform } from '../types';
/** Resolves search results to a list of platform-specific configuration. */
export declare function resolveModulesAsync(searchResults: SearchResults, autolinkingOptions: AutolinkingOptions & {
    platform: SupportedPlatform;
}): Promise<ModuleDescriptor[]>;
interface ResolveExtraBuildDependenciesParams {
    commandRoot: string;
    platform: SupportedPlatform;
}
/** Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods. */
export declare function resolveExtraBuildDependenciesAsync({ commandRoot, platform, }: ResolveExtraBuildDependenciesParams): Promise<ExtraDependencies>;
export {};
