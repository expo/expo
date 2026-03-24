import Module from 'node:module';
declare module 'node:module' {
    function _nodeModulePaths(base: string): readonly string[];
    function _resolveFilename(mod: string, parent?: Partial<Module>): string;
    const _extensions: Record<string, unknown>;
}
export interface ResolveFromParams {
    followSymlinks?: boolean;
    extensions?: readonly string[];
}
export declare function resolveFrom(fromDirectory: string, moduleId: string, params?: ResolveFromParams): string | null;
