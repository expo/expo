import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './IosConfig.types';
export declare const withScheme: import("..").ConfigPlugin;
export declare function getScheme(config: {
    scheme?: string | string[];
}): string[];
export declare function setScheme(config: Partial<Pick<ExpoConfig, 'scheme' | 'ios'>>, infoPlist: InfoPlist): InfoPlist;
export declare function appendScheme(scheme: string | null, infoPlist: InfoPlist): InfoPlist;
export declare function removeScheme(scheme: string | null, infoPlist: InfoPlist): InfoPlist;
export declare function hasScheme(scheme: string, infoPlist: InfoPlist): boolean;
export declare function getSchemesFromPlist(infoPlist: InfoPlist): string[];
