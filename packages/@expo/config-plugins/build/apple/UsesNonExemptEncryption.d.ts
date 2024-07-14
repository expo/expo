import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withUsesNonExemptEncryption: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function getUsesNonExemptEncryption(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>): boolean | null;
export declare function setUsesNonExemptEncryption(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>, { ITSAppUsesNonExemptEncryption, ...infoPlist }: InfoPlist): InfoPlist;
