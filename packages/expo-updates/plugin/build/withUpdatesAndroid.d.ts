import { ConfigPlugin, AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
declare type ExpoConfigUpdates = Pick<ExpoConfig, 'sdkVersion' | 'owner' | 'runtimeVersion' | 'updates' | 'slug'>;
export declare enum Config {
    ENABLED = "expo.modules.updates.ENABLED",
    CHECK_ON_LAUNCH = "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH",
    LAUNCH_WAIT_MS = "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS",
    SDK_VERSION = "expo.modules.updates.EXPO_SDK_VERSION",
    RUNTIME_VERSION = "expo.modules.updates.EXPO_RUNTIME_VERSION",
    UPDATE_URL = "expo.modules.updates.EXPO_UPDATE_URL"
}
export declare const withUpdatesAndroid: ConfigPlugin<{
    expoUsername: string | null;
}>;
export declare function getUpdateUrl(config: Pick<ExpoConfigUpdates, 'owner' | 'slug'>, username: string | null): string | null;
export declare function getRuntimeVersion(config: Pick<ExpoConfigUpdates, 'runtimeVersion'>): string | null;
export declare function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null;
export declare function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean;
export declare function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>): number;
export declare function getUpdatesCheckOnLaunch(config: Pick<ExpoConfigUpdates, 'updates'>): 'NEVER' | 'ALWAYS';
export declare function setUpdatesConfig(config: ExpoConfigUpdates, androidManifest: AndroidConfig.Manifest.AndroidManifest, username: string | null): AndroidConfig.Manifest.AndroidManifest;
export declare function setVersionsConfig(config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>, androidManifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
export declare function ensureBuildGradleContainsConfigurationScript(projectRoot: string, buildGradleContents: string): string;
export declare function formatApplyLineForBuildGradle(projectRoot: string): string;
export declare function isBuildGradleConfigured(projectRoot: string, buildGradleContents: string): boolean;
export declare function isMainApplicationMetaDataSet(androidManifest: AndroidConfig.Manifest.AndroidManifest): boolean;
export declare function isMainApplicationMetaDataSynced(config: ExpoConfigUpdates, androidManifest: AndroidConfig.Manifest.AndroidManifest, username: string | null): boolean;
export declare function areVersionsSynced(config: Pick<ExpoConfigUpdates, 'runtimeVersion' | 'sdkVersion'>, androidManifest: AndroidConfig.Manifest.AndroidManifest): boolean;
export {};
