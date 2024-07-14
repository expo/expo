/// <reference types="xcode" />
import * as AppleImpl from '../apple/PrivacyInfo';
export declare const withPrivacyInfo: (config: import("@expo/config-types").ExpoConfig) => import("@expo/config-types").ExpoConfig;
export declare const setPrivacyInfo: (projectConfig: import("..").ExportedConfigWithProps<import("xcode").XcodeProject>, privacyManifests: Partial<AppleImpl.PrivacyInfo>) => import("..").ExportedConfigWithProps<import("xcode").XcodeProject>;
export type { PrivacyInfo } from '../apple/PrivacyInfo';
export { mergePrivacyInfo } from '../apple/PrivacyInfo';
