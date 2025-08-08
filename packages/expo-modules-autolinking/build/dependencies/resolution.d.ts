import type { ResolutionResult } from './types';
declare module 'node:module' {
    function _nodeModulePaths(base: string): readonly string[];
}
interface ResolutionOptions {
    shouldIncludeDependency?(name: string): boolean;
}
export declare function scanDependenciesRecursively(rawPath: string, { shouldIncludeDependency }?: ResolutionOptions): Promise<ResolutionResult>;
export {};
