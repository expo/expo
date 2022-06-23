import { ConfigPlugin } from '../Plugin.types';
import { ExpoConfigUpdates } from '../utils/Updates';
import { AndroidManifest } from './Manifest';
export declare enum Config {
    ENABLED = "expo.modules.updates.ENABLED",
    CHECK_ON_LAUNCH = "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH",
    LAUNCH_WAIT_MS = "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS",
    SDK_VERSION = "expo.modules.updates.EXPO_SDK_VERSION",
    RUNTIME_VERSION = "expo.modules.updates.EXPO_RUNTIME_VERSION",
    UPDATE_URL = "expo.modules.updates.EXPO_UPDATE_URL",
    RELEASE_CHANNEL = "expo.modules.updates.EXPO_RELEASE_CHANNEL",
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY",
    CODE_SIGNING_CERTIFICATE = "expo.modules.updates.CODE_SIGNING_CERTIFICATE",
    CODE_SIGNING_METADATA = "expo.modules.updates.CODE_SIGNING_METADATA"
}
export declare const withUpdates: ConfigPlugin<{
    expoUsername: string | null;
}>;
export declare function setUpdatesConfig(projectRoot: string, config: ExpoConfigUpdates, androidManifest: AndroidManifest, username: string | null, expoUpdatesPackageVersion?: string | null): AndroidManifest;
export declare function setVersionsConfig(config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function ensureBuildGradleContainsConfigurationScript(projectRoot: string, buildGradleContents: string): string;
export declare function formatApplyLineForBuildGradle(projectRoot: string): string;
export declare function isBuildGradleConfigured(projectRoot: string, buildGradleContents: string): boolean;
export declare function isMainApplicationMetaDataSet(androidManifest: AndroidManifest): boolean;
export declare function isMainApplicationMetaDataSynced(projectRoot: string, config: ExpoConfigUpdates, androidManifest: AndroidManifest, username: string | null): boolean;
export declare function areVersionsSynced(config: Pick<ExpoConfigUpdates, 'runtimeVersion' | 'sdkVersion'>, androidManifest: AndroidManifest): boolean;
