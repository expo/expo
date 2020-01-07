import { UnavailabilityError, Platform } from '@unimodules/core';

import PushTokenManager from './PushTokenManager';

export interface NativeDevicePushToken {
  type: 'ios' | 'android';
  data: string;
}

export interface WebDevicePushToken {
  type: 'web';
  data: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

type ExplicitlySupportedDevicePushToken = NativeDevicePushToken | WebDevicePushToken;

type ImplicitlySupportedDevicePushToken = {
  type: Exclude<typeof Platform.OS, ExplicitlySupportedDevicePushToken['type']>;
  data: any;
};

export type DevicePushToken =
  | ExplicitlySupportedDevicePushToken
  | ImplicitlySupportedDevicePushToken;

export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  if (!PushTokenManager.getDevicePushTokenAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
  }

  const devicePushToken = await PushTokenManager.getDevicePushTokenAsync();

  // @ts-ignore: TS thinks Platform.OS could be anything and can't decide what type is it
  return { type: Platform.OS, data: devicePushToken };
}
