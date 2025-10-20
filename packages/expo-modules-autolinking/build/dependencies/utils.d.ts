import type { DependencyResolution, ResolutionResult } from './types';
export declare function defaultShouldIncludeDependency(dependencyName: string): boolean;
export declare const fastJoin: (from: string, append: string) => string;
export declare const maybeRealpath: (target: string) => Promise<string | null>;
export type PackageJson = Record<string, unknown> & {
    version?: string;
};
export declare const loadPackageJson: (input: string, ...args: any[]) => Promise<any>;
export declare function mergeWithDuplicate(a: DependencyResolution, b: DependencyResolution): DependencyResolution;
export declare function filterMapResolutionResult<T extends {
    name: string;
}>(results: ResolutionResult, filterMap: (resolution: DependencyResolution) => Promise<T | null> | T | null): Promise<Record<string, T>>;
export declare function mergeResolutionResults(results: ResolutionResult[]): ResolutionResult;
