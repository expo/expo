import { ExpoModuleConfig } from './ExpoModuleConfig';
export declare type SupportedPlatform = 'ios' | 'android' | 'web';
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
    namespace?: string;
    empty?: boolean;
}
export declare type PackageRevision = {
    path: string;
    version: string;
    config?: ExpoModuleConfig;
    duplicates?: PackageRevision[];
};
export declare type SearchResults = {
    [moduleName: string]: PackageRevision;
};
export declare type ModuleDescriptor = Record<string, any>;
/**
 * Represents a raw config from `expo-module.json`.
 */
export interface RawExpoModuleConfig {
    /**
     * An array of supported platforms.
     */
    platforms?: SupportedPlatform[];
    /**
     * iOS-specific config.
     */
    ios?: {
        /**
         * Names of Swift native modules classes to put to the generated modules provider file.
         */
        modulesClassNames?: string[];
    };
}
