export declare type SupportedPlatform = 'ios' | 'android';
export interface SearchOptions {
    searchPaths: string[];
    ignorePaths?: string[] | null;
    exclude?: string[] | null;
    platform: SupportedPlatform;
    flags?: Record<string, any>;
}
export interface ResolveOptions extends SearchOptions {
    json?: boolean;
}
export interface GenerateOptions extends ResolveOptions {
    target: string;
    namespace: string;
    empty?: boolean;
}
export declare type PackageRevision = {
    path: string;
    version: string;
    duplicates?: PackageRevision[];
};
export declare type SearchResults = {
    [moduleName: string]: PackageRevision;
};
export declare type ModuleDescriptor = Record<string, any>;
