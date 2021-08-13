import { Platform } from 'expo-modules-core';

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

export interface ExpoPushToken {
  type: 'expo';
  data: string;
}
