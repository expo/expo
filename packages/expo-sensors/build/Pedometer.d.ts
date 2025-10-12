import { PermissionExpiration, PermissionResponse, PermissionStatus, type EventSubscription } from 'expo-modules-core';
export type PedometerResult = {
    /**
     * Number of steps taken between the given dates.
     */
    steps: number;
};
export type PedometerEvent = {
    /**
     * Type of the pedometer event, indicating whether updates have paused or resumed.
     */
    type: 'pause' | 'resume';
    /**
     * Timestamp (in ms since the Unix epoch) associated with the pedometer event.
     */
    date: number;
};
export type PedometerEventCallback = (event: PedometerEvent) => void;
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
 * > Pedometer updates will not be delivered while the app is in the background.
 * The `getStepCountAsync` method can be used to get the step count between two dates.
 * On Android, this is subject to Play Services Recording API availability.
 */
export declare function watchStepCount(callback: PedometerUpdateCallback): EventSubscription;
/**
 * Listen for pedometer pause/resume events emitted by the underlying platform.
 * Call {@link startEventUpdatesAsync} to begin receiving events.
 * @platform android ios
 */
export declare function watchEventUpdates(callback: PedometerEventCallback): EventSubscription;
/**
 * Check if Recording API is available to track steps.
 * Resolves to `false` on iOS because the platform does not expose a Recording API toggle.
 * @return Returns a promise that fulfills with a `boolean`, indicating whether
 * historical step count data is available via the background Recording API on this device.
 *
 * > On Android, this checks for the availability of the required Play Services components.
 */
export declare function isRecordingAvailableAsync(): Promise<boolean>;
/**
 * Start pedometer pause/resume event tracking.
 * Resolves to `false` when the platform does not support pedometer events.
 * @platform android ios
 */
export declare function startEventUpdatesAsync(): Promise<boolean>;
/**
 * Stop pedometer pause/resume event tracking.
 * @platform android ios
 */
export declare function stopEventUpdatesAsync(): Promise<void>;
/**
 * Subscribe to pedometer tracking. Step count will be tracked by Google Play Services
 * Recording API, if available, until unsubscribed. Subsequent calls are safe and ignored.
 * @return Returns a promise that fulfills when the subscription is successful.
 *
 * As [Google documentation states](https://developer.android.com/health-and-fitness/guides/recording-api):
 * > `LocalRecordingClient` stores up to 10 days of data.
 * @platform android
 */
export declare function subscribeRecording(): Promise<void>;
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
export declare function unsubscribeRecording(): Promise<void>;
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