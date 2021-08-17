import { PermissionStatus, UnavailabilityError, createPermissionHook, } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExpoTrackingTransparency from './ExpoTrackingTransparency';
const androidAndWebPermissionsResponse = {
    granted: true,
    expires: 'never',
    canAskAgain: true,
    status: PermissionStatus.GRANTED,
};
/**
 * Requests the user to authorize or deny access to app-related data that can be used for tracking
 * the user or the device. Examples of data used for tracking include email address, device ID,
 * advertising ID, etc. On iOS 14.5 and above, if the user denies this permission, any attempt to
 * collect the IDFA will return a string of 0s.
 *
 * The system remembers the user’s choice and doesn’t prompt again unless a user uninstalls and then
 * reinstalls the app on the device.
 *
 * On Android, web, and iOS 13 and below, this method always returns that the permission was
 * granted.
 * @example
 * ```typescript
 * const { granted } = await requestTrackingPermissionsAsync();
 *
 * if (granted) {
 *   // Your app is authorized to track the user or their device
 * }
 * ```
 */
export async function requestTrackingPermissionsAsync() {
    if (Platform.OS !== 'ios') {
        return Promise.resolve(androidAndWebPermissionsResponse);
    }
    if (!ExpoTrackingTransparency.requestPermissionsAsync) {
        throw new UnavailabilityError('TrackingTransparency', 'requestPermissionsAsync');
    }
    return await ExpoTrackingTransparency.requestPermissionsAsync();
}
/**
 * Checks whether or not the user has authorized the app to access app-related data that can be used
 * for tracking the user or the device. See `requestTrackingPermissionsAsync` for more details.
 *
 * On Android, web, and iOS 13 and below, this method always returns that the permission was
 * granted.
 *
 * @example
 * ```typescript
 * const { granted } = await getTrackingPermissionsAsync();
 *
 * if (granted) {
 *   // Your app is authorized to track the user or their device
 * }
 * ```
 */
export async function getTrackingPermissionsAsync() {
    if (Platform.OS !== 'ios') {
        return Promise.resolve(androidAndWebPermissionsResponse);
    }
    if (!ExpoTrackingTransparency.getPermissionsAsync) {
        throw new UnavailabilityError('TrackingTransparency', 'getPermissionsAsync');
    }
    return await ExpoTrackingTransparency.getPermissionsAsync();
}
/**
 * Check or request the user to authorize or deny access to app-related data that can be used for tracking
 * the user or the device. Examples of data used for tracking include email address, device ID,
 * advertising ID, etc. On iOS 14.5 and above, if the user denies this permission, any attempt to
 * collect the IDFA will return a string of 0s.
 *
 * The system remembers the user’s choice and doesn’t prompt again unless a user uninstalls and then
 * reinstalls the app on the device.
 *
 * On Android, web, and iOS 13 and below, this method always returns that the permission was
 * granted.
 * @example
 * ```ts
 * const [status, requestPermission] = useTrackingPermissions();
 * ```
 */
export const useTrackingPermissions = createPermissionHook({
    getMethod: getTrackingPermissionsAsync,
    requestMethod: requestTrackingPermissionsAsync,
});
/**
 * Returns whether the TrackingTransparency API is available on the current device.
 *
 * @returns Currently this is `true` on iOS 14 and above only. On devices where the
 * Tracking Transparency API is unavailable, the get and request permissions methods will always
 * resolve to `granted`.
 */
export function isAvailable() {
    return (Platform.OS === 'ios' &&
        parseInt(Platform.Version.toString(), 10) >= 14 &&
        ExpoTrackingTransparency);
}
export { PermissionStatus };
//# sourceMappingURL=TrackingTransparency.js.map