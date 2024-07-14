import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withScheme: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function getScheme(config: {
    scheme?: string | string[];
}): string[];
export declare const setScheme: (applePlatform: 'ios' | 'macos') => (config: Partial<Pick<ExpoConfig, "ios" | "macos" | "scheme">>, infoPlist: InfoPlist) => InfoPlist;
export declare function appendScheme(scheme: string | null, infoPlist: InfoPlist): InfoPlist;
export declare function removeScheme(scheme: string | null, infoPlist: InfoPlist): InfoPlist;
export declare function hasScheme(scheme: string, infoPlist: InfoPlist): boolean;
export declare function getSchemesFromPlist(infoPlist: InfoPlist): string[];
