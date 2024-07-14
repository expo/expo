export declare const withScheme: import("..").ConfigPlugin;
export declare const setScheme: (config: Partial<Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos" | "scheme">>, infoPlist: import("./IosConfig.types").InfoPlist) => import("./IosConfig.types").InfoPlist;
export { getScheme, appendScheme, removeScheme, hasScheme, getSchemesFromPlist } from '../apple/Scheme';
