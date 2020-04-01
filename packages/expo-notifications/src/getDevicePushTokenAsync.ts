import { UnavailabilityError, Platform } from '@unimodules/core';

import PushTokenManager from './PushTokenManager';
import { DevicePushToken } from './Tokens.types';

export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  if (!PushTokenManager.getDevicePushTokenAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
  }

  const devicePushToken = await PushTokenManager.getDevicePushTokenAsync();

  // @ts-ignore: TS thinks Platform.OS could be anything and can't decide what type is it
  return { type: Platform.OS, data: devicePushToken };
}
