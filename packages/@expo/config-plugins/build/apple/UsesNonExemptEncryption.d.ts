import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withUsesNonExemptEncryption: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare const getUsesNonExemptEncryption: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => boolean | null;
export declare const setUsesNonExemptEncryption: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, { ITSAppUsesNonExemptEncryption, ...infoPlist }: InfoPlist) => InfoPlist;
