export declare const withVersion: import("..").ConfigPlugin;
export declare const withBuildNumber: import("..").ConfigPlugin;
export declare const getBuildNumber: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => string | undefined;
export declare const setBuildNumber: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, infoPlist: import("./MacosConfig.types").InfoPlist) => import("./MacosConfig.types").InfoPlist;
export { getVersion, setVersion } from '../apple/Version';
