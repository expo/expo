import { AutolinkingCommonArguments, AutolinkingOptions } from './commands/autolinkingOptions';
import { ModuleDescriptor, SupportedPlatform } from './types';
export * from './types';
export * from './autolinking';
export { ResolutionResult, BaseDependencyResolution, DependencyResolution, DependencyResolutionSource, CachedDependenciesLinker, CachedDependenciesSearchOptions, makeCachedDependenciesLinker, scanDependencyResolutionsForPlatform, } from './dependencies';
/** @deprecated */
export declare function mergeLinkingOptionsAsync<Options extends Partial<AutolinkingCommonArguments>>(argumentsOptions: Options): Promise<Options & AutolinkingOptions>;
/** @deprecated */
export declare function queryAutolinkingModulesFromProjectAsync(projectRoot: string, options: Partial<AutolinkingCommonArguments> & {
    platform: SupportedPlatform;
}): Promise<ModuleDescriptor[]>;
/** @deprecated */
export declare function findProjectRootSync(cwd?: string): string;
/** @deprecated */
export declare function resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
