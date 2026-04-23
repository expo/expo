import { DevicePushToken } from '../Tokens.types';
/**
 * Returns `true` if the device token or metadata has changed since the last
 * successful registration, or if the check cannot be performed (fail-open).
 */
export declare function hasDeviceTokenChangedAsync(token: DevicePushToken): Promise<boolean>;
export declare function updateDevicePushTokenAsync(signal: AbortSignal, token: DevicePushToken): Promise<void>;
//# sourceMappingURL=updateDevicePushTokenAsync.d.ts.map