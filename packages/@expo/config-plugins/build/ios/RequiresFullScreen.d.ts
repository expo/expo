export declare const withRequiresFullScreen: import("..").ConfigPlugin;
export declare const getRequiresFullScreen: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos" | "sdkVersion">) => boolean;
export declare const setRequiresFullScreen: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, infoPlist: import("./IosConfig.types").InfoPlist) => import("./IosConfig.types").InfoPlist;
