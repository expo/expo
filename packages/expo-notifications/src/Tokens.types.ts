import { Platform } from 'expo-modules-core';

// @docsMissing
export interface NativeDevicePushToken {
  type: 'ios' | 'android';
  data: string;
}

// @docsMissing
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

// @docsMissing
type ExplicitlySupportedDevicePushToken = NativeDevicePushToken | WebDevicePushToken;

type ImplicitlySupportedDevicePushToken = {
  /**
   * Either `android`, `ios` or `web`.
   */
  type: Exclude<typeof Platform.OS, ExplicitlySupportedDevicePushToken['type']>;
  /**
   * Either the push token as a string (when for native platforms), or an object conforming to the type below (for web):
   * ```ts
   * {
   *   endpoint: string;
   *   keys: {
   *     p256dh: string;
   *     auth: string;
   *   }
   * }
   * ```
   */
  data: any;
};

/**
 * In simple terms, an object of `type: Platform.OS` and `data: any`. The `data` type depends on the environment - on a native device it will be a string,
 * which you can then use to send notifications via Firebase Cloud Messaging (Android) or APNs (iOS); on web it will be a registration object (VAPID).
 */
export type DevicePushToken =
  | ExplicitlySupportedDevicePushToken
  | ImplicitlySupportedDevicePushToken;

/**
 * Borrowing structure from `DevicePushToken` a little. You can use the `data` value to send notifications via Expo Notifications service.
 */
export interface ExpoPushToken {
  /**
   * Always set to `"expo"`.
   */
  type: 'expo';
  /**
   * The acquired push token.
   */
  data: string;
}
