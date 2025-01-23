import { Android, ExpoConfig, IOS } from '@expo/config-types';
export type ExpoConfigUpdates = Pick<ExpoConfig, 'sdkVersion' | 'owner' | 'runtimeVersion' | 'updates' | 'slug'>;
export declare const FINGERPRINT_RUNTIME_VERSION_SENTINEL = "file:fingerprint";
export declare function getExpoUpdatesPackageVersion(projectRoot: string): string | null;
export declare function getUpdateUrl(config: Pick<ExpoConfigUpdates, 'updates'>): string | null;
export declare function getAppVersion(config: Pick<ExpoConfig, 'version'>): string;
export declare function getNativeVersion(config: Pick<ExpoConfig, 'version'> & {
    android?: Pick<Android, 'versionCode'>;
    ios?: Pick<IOS, 'buildNumber'>;
}, platform: 'android' | 'ios'): string;
export declare function getRuntimeVersionNullableAsync(...[projectRoot, config, platform]: Parameters<typeof getRuntimeVersionAsync>): Promise<string | null>;
export declare function getRuntimeVersionAsync(projectRoot: string, config: Pick<ExpoConfig, 'version' | 'runtimeVersion' | 'sdkVersion'> & {
    android?: Pick<Android, 'versionCode' | 'runtimeVersion'>;
    ios?: Pick<IOS, 'buildNumber' | 'runtimeVersion'>;
}, platform: 'android' | 'ios'): Promise<string | null>;
export declare function resolveRuntimeVersionPolicyAsync(policy: 'appVersion' | 'nativeVersion' | 'sdkVersion', config: Pick<ExpoConfig, 'version' | 'sdkVersion'> & {
    android?: Pick<Android, 'versionCode'>;
    ios?: Pick<IOS, 'buildNumber'>;
}, platform: 'android' | 'ios'): Promise<string>;
export declare function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null;
export declare function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean;
export declare function getUpdatesUseEmbeddedUpdate(config: Pick<ExpoConfigUpdates, 'updates'>): boolean;
export declare function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>): number;
export declare function getUpdatesCheckOnLaunch(config: Pick<ExpoConfigUpdates, 'updates'>, expoUpdatesPackageVersion?: string | null): 'NEVER' | 'ERROR_RECOVERY_ONLY' | 'ALWAYS' | 'WIFI_ONLY';
export declare function getUpdatesCodeSigningCertificate(projectRoot: string, config: Pick<ExpoConfigUpdates, 'updates'>): string | undefined;
export declare function getUpdatesCodeSigningMetadata(config: Pick<ExpoConfigUpdates, 'updates'>): NonNullable<ExpoConfigUpdates['updates']>['codeSigningMetadata'];
export declare function getUpdatesCodeSigningMetadataStringified(config: Pick<ExpoConfigUpdates, 'updates'>): string | undefined;
export declare function getUpdatesRequestHeaders(config: Pick<ExpoConfigUpdates, 'updates'>): NonNullable<ExpoConfigUpdates['updates']>['requestHeaders'];
export declare function getUpdatesRequestHeadersStringified(config: Pick<ExpoConfigUpdates, 'updates'>): string | undefined;
export declare function getDisableAntiBrickingMeasures(config: Pick<ExpoConfigUpdates, 'updates'>): boolean | undefined;
