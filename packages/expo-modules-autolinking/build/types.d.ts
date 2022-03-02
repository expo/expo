import { ExpoModuleConfig } from './ExpoModuleConfig';
export declare type SupportedPlatform = 'ios' | 'android' | 'web';
export interface SearchOptions {
    searchPaths: string[];
    ignorePaths?: string[] | null;
    exclude?: string[] | null;
    platform: SupportedPlatform;
    silent?: boolean;
    nativeModulesDir?: string | null;
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
export interface PatchReactImportsOptions {
    podsRoot: string;
    dryRun: boolean;
}
export declare type PackageRevision = {
    path: string;
    version: string;
    config?: ExpoModuleConfig;
    duplicates?: PackageRevision[];
    isExpoAdapter?: boolean;
};
export declare type SearchResults = {
    [moduleName: string]: PackageRevision;
};
export declare type ModuleDescriptorAndroid = Record<string, any>;
export interface ModuleIosPodspecInfo {
    podName: string;
    podspecDir: string;
}
export interface ModuleDescriptorIos {
    packageName: string;
    pods: ModuleIosPodspecInfo[];
    flags: Record<string, any> | undefined;
    swiftModuleNames: string[];
    modules: string[];
    appDelegateSubscribers: string[];
    reactDelegateHandlers: string[];
}
export declare type ModuleDescriptor = ModuleDescriptorAndroid | ModuleDescriptorIos;
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
        modules?: string[];
        /**
         * Names of Swift native modules classes to put to the generated modules provider file.
         * @deprecated Deprecated in favor of `modules`. Might be removed in the future releases.
         */
        modulesClassNames?: string[];
        /**
         * Names of Swift classes that hooks into `ExpoAppDelegate` to receive AppDelegate life-cycle events.
         */
        appDelegateSubscribers?: string[];
        /**
         * Names of Swift classes that implement `ExpoReactDelegateHandler` to hook React instance creation.
         */
        reactDelegateHandlers?: string[];
        /**
         * Podspec relative path.
         */
        podspecPath?: string;
        /**
         * Swift product module name. If empty, the pod name is used for Swift imports.
         */
        swiftModuleName?: string;
    };
    /**
     * Android-specific config.
     */
    android?: {
        /**
         * Full names (package + class name) of Kotlin native modules classes to put to the generated package provider file.
         */
        modules?: string[];
        /**
         * Full names (package + class name) of Kotlin native modules classes to put to the generated package provider file.
         * @deprecated Deprecated in favor of `modules`. Might be removed in the future releases.
         */
        modulesClassNames?: string[];
    };
}
