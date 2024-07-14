export declare const withUsesNonExemptEncryption: import("..").ConfigPlugin;
export declare const getUsesNonExemptEncryption: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => boolean | null;
export declare const setUsesNonExemptEncryption: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, { ITSAppUsesNonExemptEncryption, ...infoPlist }: import("./MacosConfig.types").InfoPlist) => import("./MacosConfig.types").InfoPlist;
