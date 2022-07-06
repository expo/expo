export declare type SearchResults = {
    [moduleName: string]: object;
};
export declare type SearchOptions = {
    searchPaths: string[];
    platform: 'ios' | 'android' | 'web';
    silent?: boolean;
};
export declare type AutolinkingModule = {
    resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
    findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults>;
};
/**
 * Imports the `expo-modules-autolinking` package installed in the project at the given path.
 */
export declare function importExpoModulesAutolinking(projectRoot: string): AutolinkingModule;
