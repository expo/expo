import { PackageRevision, SupportedPlatform } from '../types';
import { type ResolutionResult } from './types';
import { type Memoizer } from '../memoize';
import { RNConfigReactNativeProjectConfig } from '../reactNativeConfig';
export interface CachedDependenciesSearchOptions {
    excludeNames: Set<string>;
    searchPaths: string[];
}
export interface CachedDependenciesLinker {
    memoizer: Memoizer;
    getOptionsForPlatform(platform: SupportedPlatform): Promise<CachedDependenciesSearchOptions>;
    loadReactNativeProjectConfig(): Promise<RNConfigReactNativeProjectConfig | null>;
    scanDependenciesFromRNProjectConfig(): Promise<ResolutionResult>;
    scanDependenciesRecursively(): Promise<ResolutionResult>;
    scanDependenciesInSearchPath(searchPath: string): Promise<ResolutionResult>;
}
export declare function makeCachedDependenciesLinker(params: {
    projectRoot: string;
}): CachedDependenciesLinker;
export declare function scanDependencyResolutionsForPlatform(linker: CachedDependenciesLinker, platform: SupportedPlatform, include?: string[]): Promise<ResolutionResult>;
export declare function scanExpoModuleResolutionsForPlatform(linker: CachedDependenciesLinker, platform: SupportedPlatform): Promise<Record<string, PackageRevision>>;
