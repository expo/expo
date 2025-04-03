import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin, InfoPlist } from '../Plugin.types';
import { MergeResults } from '../utils/generateCode';
export declare const MATCH_INIT: RegExp;
export declare const withMaps: ConfigPlugin;
export declare function getGoogleMapsApiKey(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setGoogleMapsApiKey(config: Pick<ExpoConfig, 'ios'>, { GMSApiKey, ...infoPlist }: InfoPlist): InfoPlist;
export declare function addGoogleMapsAppDelegateImport(src: string): MergeResults;
export declare function removeGoogleMapsAppDelegateImport(src: string): MergeResults;
export declare function addGoogleMapsAppDelegateInit(src: string, apiKey: string): MergeResults;
export declare function removeGoogleMapsAppDelegateInit(src: string): MergeResults;
/**
 * @param src The contents of the Podfile.
 * @returns Podfile with react-native-maps' Google Maps integration configured.
 */
export declare function addMapsCocoaPods(src: string): MergeResults;
/**
 * @param src The contents of the Podfile.
 * @returns Podfile with react-native-maps integration configured.
 */
export declare function addMapsCocoaPodsNewArch(src: string, useGoogleMaps: boolean): MergeResults;
export declare function removeMapsCocoaPods(src: string): MergeResults;
export declare function getReactNativeMapsVersion(projectRoot: string): string | null;
