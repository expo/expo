export declare const nativeApplicationVersion: string | null;
export declare const nativeBuildVersion: string | null;
export declare const applicationName: string | null;
export declare const applicationId: string | null;
export declare const androidId: string | null;
export declare function getInstallReferrerAsync(): Promise<string>;
export declare function getIosIdForVendorAsync(): Promise<string | null>;
export declare enum ApplicationReleaseType {
    UNKNOWN = 0,
    SIMULATOR = 1,
    ENTERPRISE = 2,
    DEVELOPMENT = 3,
    AD_HOC = 4,
    APP_STORE = 5
}
export declare function getIosApplicationReleaseTypeAsync(): Promise<ApplicationReleaseType>;
export declare function getIosPushNotificationServiceEnvironmentAsync(): Promise<string>;
export declare function getInstallationTimeAsync(): Promise<Date>;
export declare function getLastUpdateTimeAsync(): Promise<Date>;
