export declare enum ApplicationReleaseType {
    UNKNOWN = 0,
    SIMULATOR = 1,
    ENTERPRISE = 2,
    DEVELOPMENT = 3,
    AD_HOC = 4,
    APP_STORE = 5
}
/**
 * Maps to the [`aps-environment`](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment) key in the native target's registered entitlements.
 */
export type PushNotificationServiceEnvironment = 'development' | 'production' | null;
//# sourceMappingURL=Application.types.d.ts.map