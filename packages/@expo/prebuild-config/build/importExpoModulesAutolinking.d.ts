export type SearchResults = {
    [moduleName: string]: object;
};
export type SearchOptions = {
    searchPaths: string[];
    platform: 'ios' | 'android' | 'web';
    silent?: boolean;
};
type AutolinkingModule = typeof import('expo-modules-autolinking/exports');
/**
 * Imports the `expo-modules-autolinking` package installed in the project at the given path.
 */
export declare function importExpoModulesAutolinking(projectRoot: string): AutolinkingModule;
export {};
