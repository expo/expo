import { AutolinkingCommonArguments, AutolinkingOptions } from './commands/autolinkingOptions';
import { ModuleDescriptor, SupportedPlatform } from './types';
export * from './types';
export * from './autolinking';
export * from './platforms';
export { ResolutionResult, BaseDependencyResolution, DependencyResolution, DependencyResolutionSource, CachedDependenciesLinker, CachedDependenciesSearchOptions, makeCachedDependenciesLinker, scanDependencyResolutionsForPlatform, scanExpoModuleResolutionsForPlatform, } from './dependencies';
/** @deprecated */
export declare function mergeLinkingOptionsAsync<Options extends Partial<AutolinkingCommonArguments>>(argumentsOptions: Options): Promise<Options & AutolinkingOptions>;
interface QueryAutolinkingModulesFromProjectParams extends Partial<AutolinkingCommonArguments> {
    platform: SupportedPlatform;
    [extra: string]: unknown;
}
/** @deprecated */
export declare function queryAutolinkingModulesFromProjectAsync(projectRoot: string, options: QueryAutolinkingModulesFromProjectParams): Promise<ModuleDescriptor[]>;
/** @deprecated */
export declare function findProjectRootSync(cwd?: string): string;
/** @deprecated */
export declare function resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
