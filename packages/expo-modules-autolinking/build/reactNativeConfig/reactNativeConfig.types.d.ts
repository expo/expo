/** Dependency configuration for Android platform. */
export interface RNConfigDependencyAndroid {
    sourceDir: string;
    packageImportPath: string | null;
    packageInstance: string | null;
    dependencyConfiguration?: string;
    buildTypes: string[];
    libraryName?: string | null;
    componentDescriptors?: string[] | null;
    cmakeListsPath?: string | null;
    cxxModuleCMakeListsModuleName?: string | null;
    cxxModuleCMakeListsPath?: string | null;
    cxxModuleHeaderName?: string | null;
    isPureCxxDependency?: boolean;
}
/** Dependency configuration for iOS platform. */
export interface RNConfigDependencyIos {
    podspecPath: string;
    version: string;
    configurations: string[];
    scriptPhases: any[];
}
/** Dependency configuration. */
export interface RNConfigDependency {
    root: string;
    name: string;
    platforms: {
        android?: RNConfigDependencyAndroid;
        ios?: RNConfigDependencyIos;
    };
}
/** Result of 'react-native-config' command. */
export interface RNConfigResult {
    root: string;
    reactNativePath: string;
    dependencies: Record<string, RNConfigDependency>;
    project: {
        ios?: {
            sourceDir: string;
        };
    };
}
export type RNConfigReactNativePlatformsConfigAndroid = any;
export type RNConfigReactNativePlatformsConfigIos = any;
interface RNConfigReactNativePlatformsConfig {
    root?: string;
    platforms?: {
        android?: RNConfigReactNativePlatformsConfigAndroid;
        ios?: RNConfigReactNativePlatformsConfigIos;
    };
}
/**
 * The `react-native.config.js` config from projectRoot.
 */
export interface RNConfigReactNativeProjectConfig {
    dependencies?: Record<string, RNConfigReactNativePlatformsConfig>;
}
/**
 * The `react-native.config.js` config from library packageRoot.
 */
export interface RNConfigReactNativeLibraryConfig {
    dependency?: RNConfigReactNativePlatformsConfig;
    platforms?: any;
}
export type RNConfigReactNativeConfig = RNConfigReactNativeProjectConfig | RNConfigReactNativeLibraryConfig;
/**
 * The `project` config represents the app project configuration.
 */
export interface RNConfigReactNativeAppProjectConfig {
    android?: {
        sourceDir: string;
        packageName: string;
    };
    ios?: {
        sourceDir: string;
    };
}
export {};
