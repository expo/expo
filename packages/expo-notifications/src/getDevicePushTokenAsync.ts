import { UnavailabilityError, Platform, NativeModulesProxy } from '@unimodules/core';

interface PushTokenManagerModule {
  getDevicePushTokenAsync: () => Promise<string>;
}

const ExpoPushTokenManager = (NativeModulesProxy.ExpoPushTokenManager as any) as PushTokenManagerModule;

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

export type DevicePushToken =
  | NativeDevicePushToken
  | WebDevicePushToken
  | {
      type: Exclude<typeof Platform.OS, WebDevicePushToken['type'] | NativeDevicePushToken['type']>;
      data: any;
    };

export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  if (!ExpoPushTokenManager.getDevicePushTokenAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
  }

  const devicePushToken = await ExpoPushTokenManager.getDevicePushTokenAsync();

  // @ts-ignore: TS thinks Platform.OS could be anything
  return { type: Platform.OS, data: devicePushToken };
}
