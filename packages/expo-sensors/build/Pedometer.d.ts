import { PermissionExpiration, PermissionResponse, PermissionStatus, type EventSubscription } from 'expo-modules-core';
export type PedometerResult = {
    /**
     * Number of steps taken between the given dates.
     */
    steps: number;
};
/**
 * Callback function providing event result as an argument.
 */
export type PedometerUpdateCallback = (result: PedometerResult) => void;
/**
 * Subscribe to pedometer updates.
 * @param callback A callback that is invoked when new step count data is available. The callback is
 * provided with a single argument that is [`PedometerResult`](#pedometerresult).
 * @return Returns a [`Subscription`](#subscription) that enables you to call
 * `remove()` when you would like to unsubscribe the listener.
 *
 * > Pedometer updates will not be delivered while the app is in the background. As an alternative, on Android, use another solution based on
 * > [`Health Connect API`](https://developer.android.com/health-and-fitness/guides/health-connect).
 * > On iOS, the `getStepCountAsync` method can be used to get the step count between two dates.
 */
export declare function watchStepCount(callback: PedometerUpdateCallback): EventSubscription;
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
export declare function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult>;
/**
 * Returns whether the pedometer is enabled on the device.
 * @return Returns a promise that fulfills with a `boolean`, indicating whether the pedometer is
 * available on this device.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Checks user's permissions for accessing pedometer.
 */
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing pedometer.
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export { EventSubscription as Subscription, PermissionResponse, PermissionStatus, PermissionExpiration, };
//# sourceMappingURL=Pedometer.d.ts.map