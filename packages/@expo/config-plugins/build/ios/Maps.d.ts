export declare const withMaps: import("..").ConfigPlugin;
export declare const getGoogleMapsApiKey: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => string | null;
export declare const setGoogleMapsApiKey: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, { GMSApiKey, ...infoPlist }: import("./IosConfig.types").InfoPlist) => import("./IosConfig.types").InfoPlist;
export { MATCH_INIT, addGoogleMapsAppDelegateImport, removeGoogleMapsAppDelegateImport, addGoogleMapsAppDelegateInit, removeGoogleMapsAppDelegateInit, addMapsCocoaPods, removeMapsCocoaPods, } from '../apple/Maps';
