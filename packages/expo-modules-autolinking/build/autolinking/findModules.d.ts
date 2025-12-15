import { AutolinkingOptions } from '../commands/autolinkingOptions';
import { type DependencyResolution } from '../dependencies';
import { PackageRevision, SearchResults, SupportedPlatform } from '../types';
export declare function resolveExpoModule(resolution: DependencyResolution, platform: SupportedPlatform, excludeNames: Set<string>): Promise<PackageRevision | null>;
interface FindModulesParams {
    appRoot: string;
    autolinkingOptions: AutolinkingOptions & {
        platform: SupportedPlatform;
    };
}
/** Searches for modules to link based on given config. */
export declare function findModulesAsync({ appRoot, autolinkingOptions, }: FindModulesParams): Promise<SearchResults>;
export {};
