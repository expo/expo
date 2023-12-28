import { Resources } from '.';
import { AndroidManifest } from './Manifest';
import { ResourceXML } from './Resources';
import { ConfigPlugin, ExportedConfigWithProps } from '../Plugin.types';
import { ExpoConfigUpdates } from '../utils/Updates';
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
export declare const withUpdates: ConfigPlugin;
export declare function applyRuntimeVersionFromConfigAsync(config: ExportedConfigWithProps<Resources.ResourceXML>, stringsJSON: ResourceXML): Promise<ResourceXML>;
export declare function applyRuntimeVersionFromConfigForProjectRootAsync(projectRoot: string, config: ExpoConfigUpdates, stringsJSON: ResourceXML): Promise<ResourceXML>;
export declare function setUpdatesConfigAsync(projectRoot: string, config: ExpoConfigUpdates, androidManifest: AndroidManifest, expoUpdatesPackageVersion?: string | null): Promise<AndroidManifest>;
export declare function setVersionsConfigAsync(projectRoot: string, config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>, androidManifest: AndroidManifest): Promise<AndroidManifest>;
export declare function ensureBuildGradleContainsConfigurationScript(projectRoot: string, buildGradleContents: string): string;
export declare function formatApplyLineForBuildGradle(projectRoot: string): string;
export declare function isBuildGradleConfigured(projectRoot: string, buildGradleContents: string): boolean;
export declare function isMainApplicationMetaDataSet(androidManifest: AndroidManifest): boolean;
export declare function isMainApplicationMetaDataSyncedAsync(projectRoot: string, config: ExpoConfigUpdates, androidManifest: AndroidManifest): Promise<boolean>;
export declare function areVersionsSyncedAsync(projectRoot: string, config: Pick<ExpoConfigUpdates, 'runtimeVersion' | 'sdkVersion'>, androidManifest: AndroidManifest): Promise<boolean>;
