declare module 'node:module' {
    function _nodeModulePaths(base: string): readonly string[];
    function _resolveFilename(request: string, parent?: {
        id: string;
        filename: string;
        paths: string[];
    } | string | null, isMain?: boolean, options?: {
        paths?: string[];
    }): string;
    const _extensions: Record<string, unknown>;
}
export interface ResolveFromParams {
    followSymlinks?: boolean;
    skipNodePath?: boolean;
    extensions?: readonly string[];
}
export declare function resolveFrom(fromDirectory: string, moduleId: string, params?: ResolveFromParams): string | null;
