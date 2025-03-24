import {
  PermissionExpiration,
  PermissionResponse,
  PermissionStatus,
  type EventSubscription,
  UnavailabilityError,
} from 'expo-modules-core';
import invariant from 'invariant';

import ExponentPedometer from './ExponentPedometer';

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
 * On Android, this is subject to Play Services Recording API availability.
 */
export function watchStepCount(callback: PedometerUpdateCallback): EventSubscription {
  return ExponentPedometer.addListener('Exponent.pedometerUpdate', callback);
}

/**
 * Check if Recording API is available to track steps.
 * On iOS, this is equivalent to calling `isAvailableAsync()`.
 * @return Returns a promise that fulfills with a `boolean`, indicating whether
 * historical step count data is available on this device.
 *
 * > On iOS, this is equivalent to calling `isAvailableAsync()`.
 * > On Android, this is checking for the availability of appropriate Play Services version.
 */
export function isRecordingAvailableAsync(): Promise<boolean> {
  if (!ExponentPedometer.isRecordingAvailableAsync) {
    throw new UnavailabilityError('ExponentPedometer', 'isRecordingAvailableAsync');
  }
  return ExponentPedometer.isRecordingAvailableAsync();
}

/**
 * Subscribe to pedometer tracking. Step count will be tracked by Google Play Services
 * Recording API, if available, until unsubscribed. Subsequent calls are safe and ignored.
 * @return Returns a promise that fulfills when the subscription is successful.
 *
 * As [Google documentation states](https://developer.android.com/health-and-fitness/guides/recording-api):
 * > `LocalRecordingClient` stores up to 10 days of data.
 * @platform android
 */
export async function subscribeRecording(): Promise<void> {
  if (!ExponentPedometer.subscribeRecording) {
    throw new UnavailabilityError('ExponentPedometer', 'subscribeRecording');
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
export async function unsubscribeRecording(): Promise<void> {
  if (!ExponentPedometer.unsubscribeRecording) {
    throw new UnavailabilityError('ExponentPedometer', 'unsubscribeRecording');
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
 */
export async function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult> {
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
export async function isAvailableAsync(): Promise<boolean> {
  return await ExponentPedometer.isAvailableAsync();
}

/**
 * Checks user's permissions for accessing pedometer.
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExponentPedometer.getPermissionsAsync) {
    return defaultPermissionsResponse;
  } else {
    return await ExponentPedometer.getPermissionsAsync();
  }
}

/**
 * Asks the user to grant permissions for accessing pedometer.
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExponentPedometer.requestPermissionsAsync) {
    return defaultPermissionsResponse;
  } else {
    return await ExponentPedometer.requestPermissionsAsync();
  }
}

const defaultPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

export {
  EventSubscription as Subscription,
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
};
