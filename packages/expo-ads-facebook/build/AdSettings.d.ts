import { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions } from 'expo-modules-core';
export declare type AdLogLevel = 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification';
export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
declare function requestPermissionsAsync(): Promise<PermissionResponse>;
declare function getPermissionsAsync(): Promise<PermissionResponse>;
declare const _default: {
    /**
     * Contains hash of the device id
     */
    readonly currentDeviceHash: string;
    requestPermissionsAsync: typeof requestPermissionsAsync;
    getPermissionsAsync: typeof getPermissionsAsync;
    usePermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
    /**
     * Sets whether Facebook SDK should enable advertising tracking.
     */
    setAdvertiserTrackingEnabled(enabled: boolean): void;
    /**
     * Registers given device with `deviceHash` to receive test Facebook ads.
     */
    addTestDevice(deviceHash: string): void;
    /**
     * Clears previously set test devices
     */
    clearTestDevices(): void;
    /**
     * Sets current SDK log level
     */
    setLogLevel(logLevel: AdLogLevel): void;
    /**
     * Specifies whether ads are treated as child-directed
     */
    setIsChildDirected(isDirected: boolean): void;
    /**
     * Sets mediation service name
     */
    setMediationService(mediationService: string): void;
    /**
     * Sets URL prefix
     */
    setUrlPrefix(urlPrefix: string): void;
};
export default _default;
//# sourceMappingURL=AdSettings.d.ts.map