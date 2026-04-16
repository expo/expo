import { DevicePushToken } from '../Tokens.types';
/**
 * Returns true if the device token or metadata (appId, development, type) has
 * changed since the last successful registration. Used to skip redundant server
 * requests when the app opens.
 *
 * Returns true (assume changed) if the comparison cannot be performed, to ensure
 * registration is never silently suppressed due to a storage error.
 */
export declare function hasDeviceTokenChangedAsync(token: DevicePushToken): Promise<boolean>;
export declare function updateDevicePushTokenAsync(signal: AbortSignal, token: DevicePushToken): Promise<void>;
//# sourceMappingURL=updateDevicePushTokenAsync.d.ts.map