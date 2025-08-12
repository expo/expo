import { type ResolutionResult } from './types';
interface ResolutionOptions {
    shouldIncludeDependency?(name: string): boolean;
}
export declare function scanDependenciesInSearchPath(rawPath: string, { shouldIncludeDependency }?: ResolutionOptions): Promise<ResolutionResult>;
export {};
