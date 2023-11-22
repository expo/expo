export interface VersionInfo {
    expoSdkVersion: string;
    iosDeploymentTarget: string;
    reactNativeVersionRange: string;
    androidAgpVersion?: string;
    supportCliIntegration?: boolean;
}
export declare const ExpoVersionMappings: VersionInfo[];
export declare function getDefaultSdkVersion(projectRoot: string): VersionInfo;
export declare function getLatestSdkVersion(): VersionInfo;
export declare function getVersionInfo(sdkVersion: string): VersionInfo | null;
