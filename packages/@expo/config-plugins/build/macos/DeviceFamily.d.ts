/// <reference types="xcode" />
export declare const withDeviceFamily: import("..").ConfigPlugin;
export declare const getSupportsTablet: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => boolean;
export declare const getIsTabletOnly: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => boolean;
export declare const getDeviceFamilies: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => number[];
export declare const setDeviceFamily: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, { project }: {
    project: import("xcode").XcodeProject;
}) => import("xcode").XcodeProject;
export { formatDeviceFamilies } from '../apple/DeviceFamily';
