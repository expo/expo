import type { ExpoConfig } from '@expo/config-types';
export declare function gteSdkVersion(exp: Pick<ExpoConfig, 'sdkVersion'>, sdkVersion: string): boolean;
export declare function lteSdkVersion(exp: Pick<ExpoConfig, 'sdkVersion'>, sdkVersion: string): boolean;
