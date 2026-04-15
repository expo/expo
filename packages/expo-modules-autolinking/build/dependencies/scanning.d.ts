import { type ResolutionResult, type DependencyResolution } from './types';
/** Create a mock resolution for a local search path dependency at the given path */
export declare function mockDependencyAtPath(originPath: string): Promise<DependencyResolution>;
interface ResolutionOptions {
    shouldIncludeDependency?(name: string): boolean;
}
export declare function scanDependenciesInSearchPath(rawPath: string, { shouldIncludeDependency }?: ResolutionOptions): Promise<ResolutionResult>;
export {};
