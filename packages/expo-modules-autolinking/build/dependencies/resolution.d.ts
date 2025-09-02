import { type ResolutionResult } from './types';
declare module 'node:module' {
    function _nodeModulePaths(base: string): readonly string[];
}
interface ResolutionOptions {
    shouldIncludeDependency?(name: string): boolean;
    limitDepth?: number;
}
export declare function scanDependenciesRecursively(rawPath: string, { shouldIncludeDependency, limitDepth }?: ResolutionOptions): Promise<ResolutionResult>;
export {};
