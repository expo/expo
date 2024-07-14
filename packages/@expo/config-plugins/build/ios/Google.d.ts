/// <reference types="xcode" />
export declare const withGoogle: import("..").ConfigPlugin;
export declare const withGoogleServicesFile: import("..").ConfigPlugin;
export declare const getGoogleSignInReversedClientId: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, modRequest: Pick<import("..").ModProps<import("./IosConfig.types").InfoPlist>, "projectRoot">) => string | null;
export declare const getGoogleServicesFile: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => string | null;
export declare const setGoogleSignInReversedClientId: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, infoPlist: import("./IosConfig.types").InfoPlist, modRequest: Pick<import("..").ModProps<import("./IosConfig.types").InfoPlist>, "projectRoot">) => import("./IosConfig.types").InfoPlist;
export declare const setGoogleConfig: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, infoPlist: import("./IosConfig.types").InfoPlist, modRequest: import("..").ModProps<import("./IosConfig.types").InfoPlist>) => import("./IosConfig.types").InfoPlist;
export declare const setGoogleServicesFile: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, { projectRoot, project }: {
    project: import("xcode").XcodeProject;
    projectRoot: string;
}) => import("xcode").XcodeProject;
