import { PermissionStatus, UnavailabilityError, } from 'expo-modules-core';
import invariant from 'invariant';
import ExponentPedometer from './ExponentPedometer';
// @needsAudit
/**
 * Subscribe to pedometer updates.
 * @param callback A callback that is invoked when new step count data is available. The callback is
 * provided with a single argument that is [`PedometerResult`](#pedometerresult).
 * @return Returns a [`Subscription`](#subscription) that enables you to call
 * `remove()` when you would like to unsubscribe the listener.
 *
 * > Pedometer updates will not be delivered while the app is in the background.
 * The `getStepCountAsync` method can be used to get the step count between two dates.
 * On Android, historical step counts require Play Services Recording API support and an active
 * `subscribeRecording()` subscription.
 */
export function watchStepCount(callback) {
    if (!ExponentPedometer.addListener) {
        return {
            remove() { },
        };
    }
    return ExponentPedometer.addListener('Exponent.pedometerUpdate', callback);
}
/**
 * Listen for pedometer pause/resume events emitted by the underlying platform.
 * Call {@link startEventUpdatesAsync} to begin receiving events.
 *
 * > Event delivery is best-effort and generally only while the app is running.
 * > Do not rely on it while the app is in the background or terminated.
 * > On Android, events are derived from walking/running activity transitions.
 * @platform android ios
 */
export function watchEventUpdates(callback) {
    if (!ExponentPedometer.addListener) {
        return {
            remove() { },
        };
    }
    return ExponentPedometer.addListener('Exponent.pedometerEvent', callback);
}
/**
 * Check whether step history is supported on this device.
 * On iOS, historical data is collected automatically (up to seven days).
 * @return Returns a promise that fulfills with a `boolean`, indicating whether
 * historical step count data is available on this device.
 *
 * > On Android, this checks whether the required Play Services Recording API components are available.
 * > Step history is only accessible while there is an active `subscribeRecording()` subscription.
 */
export function isRecordingAvailableAsync() {
    if (!ExponentPedometer.isRecordingAvailableAsync) {
        return Promise.resolve(false);
    }
    return ExponentPedometer.isRecordingAvailableAsync();
}
/**
 * Start pedometer pause/resume event tracking.
 * Resolves to `false` when the platform does not support pedometer events.
 * @platform android ios
 */
export async function startEventUpdatesAsync() {
    if (!ExponentPedometer.startEventUpdates) {
        return false;
    }
    return await ExponentPedometer.startEventUpdates();
}
/**
 * Stop pedometer pause/resume event tracking.
 * @platform android ios
 */
export async function stopEventUpdatesAsync() {
    if (!ExponentPedometer.stopEventUpdates) {
        return;
    }
    await ExponentPedometer.stopEventUpdates();
}
/**
 * Subscribe to pedometer tracking. Step count will be tracked by Google Play Services
 * Recording API, if available, until unsubscribed. Subsequent calls are safe and ignored.
 * @return Returns a promise that fulfills when the subscription is successful.
 *
 * As [Google documentation states](https://developer.android.com/health-and-fitness/guides/recording-api):
 * > `LocalRecordingClient` stores up to 10 days of data.
 * > Data is only accessible while there is an active subscription.
 * @platform android
 */
export async function subscribeRecording() {
    if (!ExponentPedometer.subscribeRecording) {
        return;
    }
    return await ExponentPedometer.subscribeRecording();
}
/**
 * Unsubscribe from pedometer tracking.
 * @return Returns a promise that fulfills when the unsubscription is successful.
 *
 * As [Google documentation states](https://developer.android.com/health-and-fitness/guides/recording-api):
 * > To free up resources, you should make sure to unsubscribe from
 * > the collection of sensor data when your app is no longer in need of it.
 * > Unsubscribing will also reset the historical data that was collected.
 * @platform android
 */
export async function unsubscribeRecording() {
    if (!ExponentPedometer.unsubscribeRecording) {
        return;
    }
    return await ExponentPedometer.unsubscribeRecording();
}
// @needsAudit
/**
 * Get the step count between two dates.
 * @param start A date indicating the start of the range over which to measure steps.
 * @param end A date indicating the end of the range over which to measure steps.
 * @return Returns a promise that fulfills with a [`PedometerResult`](#pedometerresult).
 *
 * As [Apple documentation states](https://developer.apple.com/documentation/coremotion/cmpedometer/1613946-querypedometerdatafromdate?language=objc):
 * > Only the past seven days worth of data is stored and available for you to retrieve. Specifying
 * > a start date that is more than seven days in the past returns only the available data.
 *
 * As [Google documentation states](https://developer.android.com/health-and-fitness/guides/recording-api):
 * > `LocalRecordingClient` stores up to 10 days of data.
 * > Data is only accessible while there is an active subscription.
 *
 * On Android, call `subscribeRecording()` before querying step history and keep it active if you want
 * the previous days to be available.
 */
export async function getStepCountAsync(start, end) {
    if (!ExponentPedometer.getStepCountAsync) {
        throw new UnavailabilityError('ExponentPedometer', 'getStepCountAsync');
    }
    invariant(start <= end, 'Pedometer: The start date must precede the end date.');
    return await ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}
/**
 * Returns whether the pedometer is enabled on the device.
 * @return Returns a promise that fulfills with a `boolean`, indicating whether the pedometer is
 * available on this device.
 */
export async function isAvailableAsync() {
    return await ExponentPedometer.isAvailableAsync();
}
/**
 * Checks user's permissions for accessing pedometer.
 */
export async function getPermissionsAsync() {
    if (!ExponentPedometer.getPermissionsAsync) {
        return defaultPermissionsResponse;
    }
    else {
        return await ExponentPedometer.getPermissionsAsync();
    }
}
/**
 * Asks the user to grant permissions for accessing pedometer.
 */
export async function requestPermissionsAsync() {
    if (!ExponentPedometer.requestPermissionsAsync) {
        return defaultPermissionsResponse;
    }
    else {
        return await ExponentPedometer.requestPermissionsAsync();
    }
}
const defaultPermissionsResponse = {
    granted: true,
    expires: 'never',
    canAskAgain: true,
    status: PermissionStatus.GRANTED,
};
export { PermissionStatus, };
//# sourceMappingURL=Pedometer.js.map