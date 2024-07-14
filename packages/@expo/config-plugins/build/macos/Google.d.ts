/// <reference types="xcode" />
export declare const withGoogle: import("..").ConfigPlugin;
export declare const withGoogleServicesFile: import("..").ConfigPlugin;
export declare const getGoogleSignInReversedClientId: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, modRequest: Pick<import("..").ModProps<import("./MacosConfig.types").InfoPlist>, "projectRoot">) => string | null;
export declare const getGoogleServicesFile: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => string | null;
export declare const setGoogleSignInReversedClientId: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, infoPlist: import("./MacosConfig.types").InfoPlist, modRequest: Pick<import("..").ModProps<import("./MacosConfig.types").InfoPlist>, "projectRoot">) => import("./MacosConfig.types").InfoPlist;
export declare const setGoogleConfig: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, infoPlist: import("./MacosConfig.types").InfoPlist, modRequest: import("..").ModProps<import("./MacosConfig.types").InfoPlist>) => import("./MacosConfig.types").InfoPlist;
export declare const setGoogleServicesFile: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, { projectRoot, project }: {
    project: import("xcode").XcodeProject;
    projectRoot: string;
}) => import("xcode").XcodeProject;
