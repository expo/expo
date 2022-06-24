import { Android, ExpoConfig, IOS } from '@expo/config-types';
export declare type ExpoConfigUpdates = Pick<ExpoConfig, 'sdkVersion' | 'owner' | 'runtimeVersion' | 'updates' | 'slug'>;
export declare function getExpoUpdatesPackageVersion(projectRoot: string): string | null;
export declare function getUpdateUrl(config: Pick<ExpoConfigUpdates, 'owner' | 'slug' | 'updates'>, username: string | null): string | null;
export declare function getNativeVersion(config: Pick<ExpoConfig, 'version'> & {
    android?: Pick<Android, 'versionCode'>;
    ios?: Pick<IOS, 'buildNumber'>;
}, platform: 'android' | 'ios'): string;
/**
 * Compute runtime version policies.
 * @return an expoConfig with only string valued platform specific runtime versions.
 */
export declare const withRuntimeVersion: (config: ExpoConfig) => ExpoConfig;
export declare function getRuntimeVersionNullable(...[config, platform]: Parameters<typeof getRuntimeVersion>): string | null;
export declare function getRuntimeVersion(config: Pick<ExpoConfig, 'version' | 'runtimeVersion' | 'sdkVersion'> & {
    android?: Pick<Android, 'versionCode' | 'runtimeVersion'>;
    ios?: Pick<IOS, 'buildNumber' | 'runtimeVersion'>;
}, platform: 'android' | 'ios'): string | null;
export declare function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null;
export declare function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean;
export declare function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>): number;
export declare function getUpdatesCheckOnLaunch(config: Pick<ExpoConfigUpdates, 'updates'>, expoUpdatesPackageVersion?: string | null): 'NEVER' | 'ERROR_RECOVERY_ONLY' | 'ALWAYS';
export declare function getUpdatesCodeSigningCertificate(projectRoot: string, config: Pick<ExpoConfigUpdates, 'updates'>): string | undefined;
export declare function getUpdatesCodeSigningMetadata(config: Pick<ExpoConfigUpdates, 'updates'>): NonNullable<ExpoConfigUpdates['updates']>['codeSigningMetadata'];
export declare function getUpdatesCodeSigningMetadataStringified(config: Pick<ExpoConfigUpdates, 'updates'>): string | undefined;
