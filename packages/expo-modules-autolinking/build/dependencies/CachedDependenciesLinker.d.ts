import { PackageRevision, SupportedPlatform } from '../types';
import { type ResolutionResult, DependencyResolution } from './types';
import { type Memoizer } from '../memoize';
import { RNConfigReactNativeProjectConfig } from '../reactNativeConfig';
export interface CachedDependenciesSearchOptions {
    includeNames: Set<string>;
    excludeNames: Set<string>;
    searchPaths: string[];
}
export interface CachedDependenciesLinker {
    memoizer: Memoizer;
    getOptionsForPlatform(platform: SupportedPlatform, extraInclude?: string[]): Promise<CachedDependenciesSearchOptions>;
    loadReactNativeProjectConfig(): Promise<RNConfigReactNativeProjectConfig | null>;
    scanDependenciesFromRNProjectConfig(): Promise<ResolutionResult>;
    scanDependenciesRecursively(): Promise<ResolutionResult>;
    scanDependenciesInSearchPath(searchPath: string): Promise<ResolutionResult>;
}
export declare function makeCachedDependenciesLinker(params: {
    projectRoot: string;
}): CachedDependenciesLinker;
export declare function isNativeModuleAsync(resolution: DependencyResolution, reactNativeProjectConfig: RNConfigReactNativeProjectConfig | null, platform: SupportedPlatform, excludeNames: Set<string>): Promise<boolean>;
export declare function scanDependencyResolutionsForPlatform(linker: CachedDependenciesLinker, platform: SupportedPlatform, extraInclude?: string[]): Promise<ResolutionResult>;
export declare function scanExpoModuleResolutionsForPlatform(linker: CachedDependenciesLinker, platform: SupportedPlatform, extraInclude?: string[]): Promise<Record<string, PackageRevision>>;
