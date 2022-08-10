import { ModConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export { ExpoConfig };
export declare type PackageJSONConfig = {
    dependencies?: Record<string, string>;
    [key: string]: any;
};
export interface ProjectConfig {
    /**
     * Fully evaluated Expo config with default values injected.
     */
    exp: ExpoConfig;
    /**
     * Dynamic config for processing native files during the generation process.
     */
    mods?: ModConfig | null;
    /**
     * Project package.json object with default values injected.
     */
    pkg: PackageJSONConfig;
    /**
     * Unaltered static config (app.config.json, app.json, or custom json config).
     * For legacy, an empty object will be returned even if no static config exists.
     */
    rootConfig: AppJSONConfig;
    /**
     * Path to the static json config file if it exists.
     * If a project has an app.config.js and an app.json then app.json will be returned.
     * If a project has an app.config.json and an app.json then app.config.json will be returned.
     * Returns null if no static config file exists.
     */
    staticConfigPath: string | null;
    /**
     * Path to an app.config.js or app.config.ts.
     * Returns null if no dynamic config file exists.
     */
    dynamicConfigPath: string | null;
    /**
     * Returns the type of the value exported from the dynamic config.
     * This can be used to determine if the dynamic config is potentially extending a static config when (v === 'function').
     * Returns null if no dynamic config file exists.
     */
    dynamicConfigObjectType: string | null;
}
export declare type AppJSONConfig = {
    expo: ExpoConfig;
    [key: string]: any;
};
export declare type BareAppConfig = {
    name: string;
    [key: string]: any;
};
export declare type HookArguments = {
    config: any;
    url: any;
    exp: ExpoConfig;
    iosBundle: string | Uint8Array;
    iosSourceMap: string | null;
    iosManifest: any;
    iosManifestUrl: string;
    androidBundle: string | Uint8Array;
    androidSourceMap: string | null;
    androidManifest: any;
    androidManifestUrl: string;
    projectRoot: string;
    log: (msg: any) => void;
};
export declare type ExpoGoConfig = {
    mainModuleName: string;
    __flipperHack: 'React Native packager is running';
    debuggerHost: string;
    logUrl: string;
    developer: {
        tool: string | null;
        projectRoot?: string;
    };
    packagerOpts: {
        [key: string]: any;
    };
};
export declare type EASConfig = {
    projectId?: string;
};
export declare type ClientScopingConfig = {
    scopeKey?: string;
};
export declare type ExpoClientConfig = ExpoConfig & {
    id?: string;
    releaseId?: string;
    revisionId?: string;
    bundleUrl?: string;
    hostUri?: string;
    publishedTime?: string;
};
export declare type ExpoAppManifest = ExpoClientConfig & EASConfig & Partial<ExpoGoConfig> & {
    sdkVersion: string;
    bundledAssets?: string[];
    isKernel?: boolean;
    kernel?: {
        androidManifestPath?: string;
        iosManifestPath?: string;
    };
    assetUrlOverride?: string;
    commitTime?: string;
    env?: Record<string, any>;
};
export interface ExpoUpdatesManifestAsset {
    url: string;
    key: string;
    contentType: string;
    hash?: string;
}
export interface ExpoUpdatesManifest {
    id: string;
    createdAt: string;
    runtimeVersion: string;
    launchAsset: ExpoUpdatesManifestAsset;
    assets: ExpoUpdatesManifestAsset[];
    metadata: {
        [key: string]: string;
    };
    extra: ClientScopingConfig & {
        expoClient?: ExpoClientConfig;
        expoGo?: ExpoGoConfig;
        eas?: EASConfig;
    };
}
export declare type Hook = {
    file: string;
    config: any;
};
export declare type HookType = 'postPublish' | 'postExport';
export declare enum ProjectPrivacy {
    PUBLIC = "public",
    UNLISTED = "unlisted"
}
export declare type ExpRc = {
    [key: string]: any;
};
export declare type Platform = 'android' | 'ios' | 'web';
export declare type ProjectTarget = 'managed' | 'bare';
export declare type ConfigErrorCode = 'NO_APP_JSON' | 'NOT_OBJECT' | 'NO_EXPO' | 'MODULE_NOT_FOUND' | 'INVALID_MODE' | 'INVALID_FORMAT' | 'INVALID_PLUGIN' | 'INVALID_CONFIG';
export declare type ConfigContext = {
    projectRoot: string;
    /**
     * The static config path either app.json, app.config.json, or a custom user-defined config.
     */
    staticConfigPath: string | null;
    packageJsonPath: string | null;
    config: Partial<ExpoConfig>;
};
export declare type GetConfigOptions = {
    isPublicConfig?: boolean;
    /**
     * Should the config `mods` be preserved in the config? Used for compiling mods in the eject command.
     *
     * @default false
     */
    isModdedConfig?: boolean;
    skipSDKVersionRequirement?: boolean;
    /**
     * Dangerously skip resolving plugins.
     */
    skipPlugins?: boolean;
    strict?: boolean;
};
export declare type WriteConfigOptions = {
    dryRun?: boolean;
};
export declare type ConfigFilePaths = {
    staticConfigPath: string | null;
    dynamicConfigPath: string | null;
};
