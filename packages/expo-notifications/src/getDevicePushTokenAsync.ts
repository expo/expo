import { UnavailabilityError, Platform } from 'expo-modules-core';

import PushTokenManager from './PushTokenManager';
import { DevicePushToken } from './Tokens.types';

let nativeTokenPromise: Promise<string> | null = null;

export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  if (!PushTokenManager.getDevicePushTokenAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
  }

  let devicePushToken: string | null = null;
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
