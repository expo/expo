import xcode from 'xcode';
import { ExpoPlist } from './IosConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { ExpoConfigUpdates } from '../utils/Updates';
export declare enum Config {
    ENABLED = "EXUpdatesEnabled",
    CHECK_ON_LAUNCH = "EXUpdatesCheckOnLaunch",
    LAUNCH_WAIT_MS = "EXUpdatesLaunchWaitMs",
    RUNTIME_VERSION = "EXUpdatesRuntimeVersion",
    SDK_VERSION = "EXUpdatesSDKVersion",
    UPDATE_URL = "EXUpdatesURL",
    RELEASE_CHANNEL = "EXUpdatesReleaseChannel",
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "EXUpdatesRequestHeaders",
    CODE_SIGNING_CERTIFICATE = "EXUpdatesCodeSigningCertificate",
    CODE_SIGNING_METADATA = "EXUpdatesCodeSigningMetadata"
}
export declare const withUpdates: ConfigPlugin;
export declare function setUpdatesConfigAsync(projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist, expoUpdatesPackageVersion?: string | null): Promise<ExpoPlist>;
export declare function setVersionsConfigAsync(projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist): Promise<ExpoPlist>;
interface ShellScriptBuildPhase {
    isa: 'PBXShellScriptBuildPhase';
    name: string;
    shellScript: string;
    [key: string]: any;
}
export declare function getBundleReactNativePhase(project: xcode.XcodeProject): ShellScriptBuildPhase;
export declare function ensureBundleReactNativePhaseContainsConfigurationScript(projectRoot: string, project: xcode.XcodeProject): xcode.XcodeProject;
export declare function isShellScriptBuildPhaseConfigured(projectRoot: string, project: xcode.XcodeProject): boolean;
export declare function isPlistConfigurationSet(expoPlist: ExpoPlist): boolean;
export declare function isPlistConfigurationSyncedAsync(projectRoot: string, config: ExpoConfigUpdates, expoPlist: ExpoPlist): Promise<boolean>;
export declare function isPlistVersionConfigurationSyncedAsync(projectRoot: string, config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>, expoPlist: ExpoPlist): Promise<boolean>;
export {};
