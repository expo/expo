import { UnavailabilityError, Platform } from 'expo-modules-core';

import PushTokenManager from './PushTokenManager';
import { DevicePushToken } from './Tokens.types';
import { warnOfExpoGoPushUsage } from './warnOfExpoGoPushUsage';

let nativeTokenPromise: Promise<string> | null = null;

/**
 * Returns a native FCM, APNs token or a [`PushSubscription` data](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription)
 * that can be used with another push notification service.
 * @header fetch
 */
export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  if (!PushTokenManager.getDevicePushTokenAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
  }
  warnOfExpoGoPushUsage();

  let devicePushToken: string | null;
  if (nativeTokenPromise) {
    // Reuse existing Promise
    devicePushToken = await nativeTokenPromise;
  } else {
    // Create a new Promise and clear it afterwards
    nativeTokenPromise = PushTokenManager.getDevicePushTokenAsync();
    devicePushToken = await nativeTokenPromise;
    nativeTokenPromise = null;
  }

  // @ts-ignore: TS thinks Platform.OS could be anything and can't decide what type is it
  return { type: Platform.OS, data: devicePushToken };
}
