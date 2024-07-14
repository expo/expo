export declare const withScheme: import("..").ConfigPlugin;
export declare const setScheme: (config: Partial<Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos" | "scheme">>, infoPlist: import("./MacosConfig.types").InfoPlist) => import("./MacosConfig.types").InfoPlist;
export { getScheme, appendScheme, removeScheme, hasScheme, getSchemesFromPlist, } from '../apple/Scheme';
