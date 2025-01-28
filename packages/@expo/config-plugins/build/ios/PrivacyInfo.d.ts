import { ExpoConfig } from '@expo/config-types';
import type { XcodeProject } from 'xcode';
import { ExportedConfigWithProps } from '../Plugin.types';
export type PrivacyInfo = {
    NSPrivacyAccessedAPITypes: {
        NSPrivacyAccessedAPIType: string;
        NSPrivacyAccessedAPITypeReasons: string[];
    }[];
    NSPrivacyCollectedDataTypes: {
        NSPrivacyCollectedDataType: string;
        NSPrivacyCollectedDataTypeLinked: boolean;
        NSPrivacyCollectedDataTypeTracking: boolean;
        NSPrivacyCollectedDataTypePurposes: string[];
    }[];
    NSPrivacyTracking: boolean;
    NSPrivacyTrackingDomains: string[];
};
export declare function withPrivacyInfo(config: ExpoConfig): ExpoConfig;
export declare function setPrivacyInfo(projectConfig: ExportedConfigWithProps<XcodeProject>, privacyManifests: Partial<PrivacyInfo>): ExportedConfigWithProps<XcodeProject>;
export declare function mergePrivacyInfo(existing: Partial<PrivacyInfo>, privacyManifests: Partial<PrivacyInfo>): PrivacyInfo;
