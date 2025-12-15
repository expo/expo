export declare const enum DependencyResolutionSource {
    RECURSIVE_RESOLUTION = 0,
    SEARCH_PATH = 1,
    RN_CLI_LOCAL = 2
}
export interface BaseDependencyResolution {
    name: string;
    version: string;
    path: string;
    originPath: string;
}
export interface DependencyResolution extends BaseDependencyResolution {
    source: DependencyResolutionSource;
    duplicates: BaseDependencyResolution[] | null;
    depth: number;
    [prop: string]: unknown;
}
export type ResolutionResult = Record<string, DependencyResolution | undefined>;
