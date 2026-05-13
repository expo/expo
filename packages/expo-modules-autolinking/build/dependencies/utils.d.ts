import { type DependencyResolution, type ResolutionResult } from './types';
export declare function defaultShouldIncludeDependency(dependencyName: string): boolean;
export declare function mergeWithDuplicate(a: DependencyResolution, b: DependencyResolution): DependencyResolution;
export declare function filterMapResolutionResult<T extends {
    name: string;
}>(results: ResolutionResult, filterMap: (resolution: DependencyResolution) => Promise<T | null> | T | null): Promise<Record<string, T>>;
export declare function mergeResolutionResults(results: ResolutionResult[], base?: ResolutionResult): ResolutionResult;
