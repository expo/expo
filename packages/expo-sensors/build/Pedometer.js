import { PermissionStatus, EventEmitter, UnavailabilityError, } from 'expo-modules-core';
import invariant from 'invariant';
import ExponentPedometer from './ExponentPedometer';
const PedometerEventEmitter = new EventEmitter(ExponentPedometer);
// @needsAudit
/**
 * Subscribe to pedometer updates.
 * @param callback A callback that is invoked when new step count data is available. The callback is
 * provided with a single argument that is [`PedometerResult`](#pedometerresult).
 * @return Returns a [`Subscription`](#subscription) that enables you to call
 * `remove()` when you would like to unsubscribe the listener.
 */
export function watchStepCount(callback) {
    return PedometerEventEmitter.addListener('Exponent.pedometerUpdate', callback);
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
 * @platform ios
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
export { PermissionStatus };
//# sourceMappingURL=Pedometer.js.map