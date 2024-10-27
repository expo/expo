import { ExpoPlist } from './IosConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { ExpoConfigUpdates } from '../utils/Updates';
export declare enum Config {
    ENABLED = "EXUpdatesEnabled",
    CHECK_ON_LAUNCH = "EXUpdatesCheckOnLaunch",
    LAUNCH_WAIT_MS = "EXUpdatesLaunchWaitMs",
    RUNTIME_VERSION = "EXUpdatesRuntimeVersion",
    UPDATE_URL = "EXUpdatesURL",
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "EXUpdatesRequestHeaders",
    UPDATES_HAS_EMBEDDED_UPDATE = "EXUpdatesHasEmbeddedUpdate",
    CODE_SIGNING_CERTIFICATE = "EXUpdatesCodeSigningCertificate",
    CODE_SIGNING_METADATA = "EXUpdatesCodeSigningMetadata"
}
export declare const withUpdates: ConfigPlugin;
export declare function setUpdatesConfigAsync(projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist, expoUpdatesPackageVersion?: string | null): Promise<ExpoPlist>;
export declare function setVersionsConfigAsync(projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist): Promise<ExpoPlist>;
