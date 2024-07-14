import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin, InfoPlist } from '../Plugin.types';
import { MergeResults } from '../utils/generateCode';
export declare const MATCH_INIT: RegExp;
export declare const withMaps: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare function getGoogleMapsApiKey(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>): string | null;
export declare function setGoogleMapsApiKey(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>, { GMSApiKey, ...infoPlist }: InfoPlist): InfoPlist;
export declare function addGoogleMapsAppDelegateImport(src: string): MergeResults;
export declare function removeGoogleMapsAppDelegateImport(src: string): MergeResults;
export declare function addGoogleMapsAppDelegateInit(src: string, apiKey: string): MergeResults;
export declare function removeGoogleMapsAppDelegateInit(src: string): MergeResults;
/**
 * @param src The contents of the Podfile.
 * @returns Podfile with Google Maps added.
 */
export declare function addMapsCocoaPods(src: string): MergeResults;
export declare function removeMapsCocoaPods(src: string): MergeResults;
