import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withAppleAuthIOS: ConfigPlugin;
export declare function setAppleAuthEntitlements(config: Pick<ExpoConfig, 'ios'>, entitlements: Record<string, any>): Record<string, any>;
