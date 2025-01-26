import { UnavailabilityError, PermissionStatus, createPermissionHook, } from 'expo-modules-core';
import { useEffect } from 'react';
import ExpoScreenCapture from './ExpoScreenCapture';
const activeTags = new Set();
const onScreenshotEventName = 'onScreenshot';
const onRecordingEventName = 'onRecording';
// @needsAudit
/**
 * Returns whether the Screen Capture API is available on the current device.
 *
 * @returns A promise that resolves to a `boolean` indicating whether the Screen Capture API is available on the current
 * device.
 */
export async function isAvailableAsync() {
    return !!ExpoScreenCapture.preventScreenCapture && !!ExpoScreenCapture.allowScreenCapture;
}
// @needsAudit
/**
 * Prevents screenshots and screen recordings until `allowScreenCaptureAsync` is called or the app is restarted. If you are
 * already preventing screen capture, this method does nothing (unless you pass a new and unique `key`).
 *
 * > Please note that on iOS, this will only prevent screen recordings, and is only available on
 * iOS 11 and newer. On older iOS versions, this method does nothing.
 *
 * @param key Optional. If provided, this will help prevent multiple instances of the `preventScreenCaptureAsync`
 * and `allowScreenCaptureAsync` methods (and `usePreventScreenCapture` hook) from conflicting with each other.
 * When using multiple keys, you'll have to re-allow each one in order to re-enable screen capturing.
 *
 * @platform android
 * @platform ios 11+
 */
export async function preventScreenCaptureAsync(key = 'default') {
    if (!ExpoScreenCapture.preventScreenCapture) {
        throw new UnavailabilityError('ScreenCapture', 'preventScreenCaptureAsync');
    }
    if (!activeTags.has(key)) {
        activeTags.add(key);
        await ExpoScreenCapture.preventScreenCapture();
    }
}
// @needsAudit
/**
 * Re-allows the user to screen record or screenshot your app. If you haven't called
 * `preventScreenCapture()` yet, this method does nothing.
 *
 * @param key This will prevent multiple instances of the `preventScreenCaptureAsync` and
 * `allowScreenCaptureAsync` methods from conflicting with each other. If provided, the value must
 * be the same as the key passed to `preventScreenCaptureAsync` in order to re-enable screen
 * capturing.
 */
export async function allowScreenCaptureAsync(key = 'default') {
    if (!ExpoScreenCapture.preventScreenCapture) {
        throw new UnavailabilityError('ScreenCapture', 'allowScreenCaptureAsync');
    }
    activeTags.delete(key);
    if (activeTags.size === 0) {
        await ExpoScreenCapture.allowScreenCapture();
    }
}
// @needsAudit
/**
 * A React hook to prevent screen capturing for as long as the owner component is mounted.
 *
 * @param key If provided, this will prevent multiple instances of this hook or the
 * `preventScreenCaptureAsync` and `allowScreenCaptureAsync` methods from conflicting with each other.
 * This argument is useful if you have multiple active components using the `allowScreenCaptureAsync`
 * hook.
 */
export function usePreventScreenCapture(key = 'default') {
    useEffect(() => {
        preventScreenCaptureAsync(key);
        return () => {
            allowScreenCaptureAsync(key);
        };
    }, [key]);
}
// @needsAudit
/**
 * Adds a listener that will fire whenever the user takes a screenshot while the app is foregrounded.
 * On Android, this method requires the `READ_EXTERNAL_STORAGE` permission. You can request this
 * with [`MediaLibrary.requestPermissionsAsync()`](./media-library/#medialibraryrequestpermissionsasync).
 *
 * @param listener The function that will be executed when the user takes a screenshot.
 * This function accepts no arguments.
 *
 * @return A `Subscription` object that you can use to unregister the listener, either by calling
 * `remove()` or passing it to `removeScreenshotListener`.
 */
export function addScreenshotListener(listener) {
    return ExpoScreenCapture.addListener(onScreenshotEventName, listener);
}
// @needsAudit
/**
 * Adds a listener that will fire whenever the app starts or stops to be recorded.
 *
 * @param listener The function that will be executed when the user takes a screen recording.
 * This function accepts a single boolean argument that indicates whether the screen recording
 * started or stopped.
 * @platform android 15+
 * @platform ios 11+
 * @return A `Subscription` object that you can use to unregister the listener, either by calling
 * `remove()` or passing it to `removeRecordingListener`.
 */
export function addRecordingListener(listener) {
    return ExpoScreenCapture.addListener(onRecordingEventName, listener);
}
// @needsAudit
/**
 * Removes the subscription you provide, so that you are no longer listening for screenshots.
 * You can also call `remove()` on that `Subscription` object.
 *
 * @param subscription Subscription returned by `addScreenshotListener`.
 *
 * @example
 * ```ts
 * let mySubscription = addScreenshotListener(() => {
 *   console.log("You took a screenshot!");
 * });
 * ...
 * mySubscription.remove();
 * // OR
 * removeScreenshotListener(mySubscription);
 * ```
 */
export function removeScreenshotListener(subscription) {
    subscription.remove();
}
// @needsAudit
/**
 * Removes the subscription you provide, so that you are no longer listening for screen recordings.
 * You can also call `remove()` on that `Subscription` object.
 *
 * @param subscription Subscription returned by `addRecordingListener`.
 * @platform android 15+
 * @platform ios 11+
 */
export function removeRecordingListener(subscription) {
    subscription.remove();
}
/**
 * Checks user's permissions for detecting when a screenshot is taken.
 * > Only Android requires additional permissions to detect screenshots. On iOS devices, this method will always resolve to a `granted` permission response.
 * @return A promise that resolves to a [`PermissionResponse`](#permissionresponse) object.
 */
export async function getPermissionsAsync() {
    if (ExpoScreenCapture.getPermissionsAsync) {
        return ExpoScreenCapture.getPermissionsAsync();
    }
    return defaultPermissionsResponse;
}
/**
 * Asks the user to grant permissions necessary for detecting when a screenshot is taken.
 * > Only Android requires additional permissions to detect screenshots. On iOS devices, this method will always resolve to a `granted` permission response.
 * @return A promise that resolves to a [`PermissionResponse`](#permissionresponse) object.
 * */
export async function requestPermissionsAsync() {
    if (ExpoScreenCapture.requestPermissionsAsync) {
        return ExpoScreenCapture.requestPermissionsAsync();
    }
    return defaultPermissionsResponse;
}
/**
 * Check or request permissions necessary for detecting when a screenshot is taken.
 * This uses both [`requestPermissionsAsync`](#screencapturerequestpermissionsasync) and [`getPermissionsAsync`](#screencapturegetpermissionsasync) to interact with the permissions.
 *
 * @example
 * ```js
 * const [status, requestPermission] = ScreenCapture.usePermissions();
 * ```
 */
export const usePermissions = createPermissionHook({
    getMethod: getPermissionsAsync,
    requestMethod: requestPermissionsAsync,
});
const defaultPermissionsResponse = {
    granted: true,
    expires: 'never',
    canAskAgain: true,
    status: PermissionStatus.GRANTED,
};
export { PermissionStatus, };
//# sourceMappingURL=ScreenCapture.js.map