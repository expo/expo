export declare enum DeviceType {
    PHONE = "PHONE",
    TABLET = "TABLET",
    DESKTOP = "DESKTOP",
    TV = "TV",
    UNKNOWN = "UNKNOWN"
}
export declare let modelName: any;
export declare const modelId: any;
export declare const osBuildFingerprint: any;
export declare const designName: any;
export declare const productName: any;
export declare const platformApiLevel: any;
export declare const brand: any;
export declare const manufacturer: any;
export declare const osName: any;
export declare const totalMemory: any;
export declare const isDevice: any;
export declare const supportedCpuArchitectures: any;
export declare const osBuildId: any;
export declare const osVersion: any;
export declare const deviceName: any;
export declare const osInternalBuildId: any;
export declare const deviceYearClass: any;
export declare function hasPlatformFeatureAsync(feature: string): Promise<boolean>;
export declare function getPlatformFeaturesAsync(): Promise<string[]>;
export declare function getMaxMemoryAsync(): Promise<number>;
export declare function isSideLoadingEnabledAsync(): Promise<boolean>;
export declare function getUptimeAsync(): Promise<number>;
export declare function isRootedExperimentalAsync(): Promise<boolean>;
export declare function getDeviceTypeAsync(): Promise<DeviceType>;
