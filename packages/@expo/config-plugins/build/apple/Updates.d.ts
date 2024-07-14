import { ExpoPlist } from './AppleConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { ExpoConfigUpdates } from '../utils/Updates';
export declare enum Config {
    ENABLED = "EXUpdatesEnabled",
    CHECK_ON_LAUNCH = "EXUpdatesCheckOnLaunch",
    LAUNCH_WAIT_MS = "EXUpdatesLaunchWaitMs",
    RUNTIME_VERSION = "EXUpdatesRuntimeVersion",
    UPDATE_URL = "EXUpdatesURL",
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "EXUpdatesRequestHeaders",
    CODE_SIGNING_CERTIFICATE = "EXUpdatesCodeSigningCertificate",
    CODE_SIGNING_METADATA = "EXUpdatesCodeSigningMetadata"
}
export declare const withUpdates: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare const setUpdatesConfigAsync: (applePlatform: 'ios' | 'macos') => (projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist, expoUpdatesPackageVersion?: string | null) => Promise<ExpoPlist>;
export declare const setVersionsConfigAsync: (applePlatform: 'ios' | 'macos') => (projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist) => Promise<ExpoPlist>;
