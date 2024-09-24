import { Resources } from '.';
import { AndroidManifest } from './Manifest';
import { ResourceXML } from './Resources';
import { ConfigPlugin, ExportedConfigWithProps } from '../Plugin.types';
import { ExpoConfigUpdates } from '../utils/Updates';
export declare enum Config {
    ENABLED = "expo.modules.updates.ENABLED",
    CHECK_ON_LAUNCH = "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH",
    LAUNCH_WAIT_MS = "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS",
    RUNTIME_VERSION = "expo.modules.updates.EXPO_RUNTIME_VERSION",
    UPDATE_URL = "expo.modules.updates.EXPO_UPDATE_URL",
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY",
    UPDATES_HAS_EMBEDDED_UPDATE = "expo.modules.updates.HAS_EMBEDDED_UPDATE",
    CODE_SIGNING_CERTIFICATE = "expo.modules.updates.CODE_SIGNING_CERTIFICATE",
    CODE_SIGNING_METADATA = "expo.modules.updates.CODE_SIGNING_METADATA"
}
export declare const withUpdates: ConfigPlugin;
export declare function applyRuntimeVersionFromConfigAsync(config: ExportedConfigWithProps<Resources.ResourceXML>, stringsJSON: ResourceXML): Promise<ResourceXML>;
export declare function applyRuntimeVersionFromConfigForProjectRootAsync(projectRoot: string, config: ExpoConfigUpdates, stringsJSON: ResourceXML): Promise<ResourceXML>;
export declare function setUpdatesConfigAsync(projectRoot: string, config: ExpoConfigUpdates, androidManifest: AndroidManifest, expoUpdatesPackageVersion?: string | null): Promise<AndroidManifest>;
export declare function setVersionsConfigAsync(projectRoot: string, config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>, androidManifest: AndroidManifest): Promise<AndroidManifest>;
