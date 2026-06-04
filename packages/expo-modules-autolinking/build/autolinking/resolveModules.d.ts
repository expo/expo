import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import type { ExtraDependencies, ModuleDescriptor, SearchResults, SupportedPlatform } from '../types';
interface ResolveModulesContext {
    /** JS project root, used to resolve conditional (`autolinkWhen`) npm packages. */
    appRoot?: string;
    /** Native project directory (e.g. `ios/`) where `Podfile.properties.json` lives. */
    commandRoot?: string;
}
/** Resolves search results to a list of platform-specific configuration. */
export declare function resolveModulesAsync(searchResults: SearchResults, autolinkingOptions: AutolinkingOptions & {
    platform: SupportedPlatform;
}, context?: ResolveModulesContext): Promise<ModuleDescriptor[]>;
interface ResolveExtraBuildDependenciesParams {
    commandRoot: string;
    platform: SupportedPlatform;
}
/** Resolves the extra build dependencies for the project, such as additional Maven repositories or CocoaPods pods. */
export declare function resolveExtraBuildDependenciesAsync({ commandRoot, platform, }: ResolveExtraBuildDependenciesParams): Promise<ExtraDependencies>;
export {};
