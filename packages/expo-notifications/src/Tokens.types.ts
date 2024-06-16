import { type Platform } from 'expo-modules-core';

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
    keys: WebDevicePushTokenKeys;
  };
}

// @docsMissing
export type WebDevicePushTokenKeys = {
  p256dh: string;
  auth: string;
};

// @docsMissing
export type ExplicitlySupportedDevicePushToken = NativeDevicePushToken | WebDevicePushToken;

export type ImplicitlySupportedDevicePushToken = {
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

// @needsAudit
export interface ExpoPushTokenOptions {
  /**
   * Endpoint URL override.
   */
  baseUrl?: string;
  /**
   * Request URL override.
   */
  url?: string;
  /**
   * Request body override.
   */
  type?: string;
  // @docsMissing
  deviceId?: string;
  /**
   * Makes sense only on iOS, where there are two push notification services: "sandbox" and "production".
   * This defines whether the push token is supposed to be used with the sandbox platform notification service.
   * Defaults to [`Application.getIosPushNotificationServiceEnvironmentAsync()`](./application/#applicationgetiospushnotificationserviceenvironmentasync)
   * exposed by `expo-application` or `false`. Most probably you won't need to customize that.
   * You may want to customize that if you don't want to install `expo-application` and still use the sandbox APNs.
   * @platform ios
   */
  development?: boolean;
  /**
   * The ID of the project to which the token should be attributed.
   * Defaults to [`Constants.expoConfig.extra.eas.projectId`](./constants/#easconfig) exposed by `expo-constants`.
   *
   * When using EAS Build, this value is automatically set. However, it is
   * **recommended** to set it manually. Once you have EAS Build configured, you can find
   * the value in **app.json** under `extra.eas.projectId`. You can copy and paste it into your code.
   * If you are not using EAS Build, it will fallback to [`Constants.expoConfig?.extra?.eas?.projectId`](./constants/#manifest).
   */
  projectId?: string;
  /**
   * The ID of the application to which the token should be attributed.
   * Defaults to [`Application.applicationId`](./application/#applicationapplicationid) exposed by `expo-application`.
   */
  applicationId?: string;
  /**
   * The device push token with which to register at the backend.
   * Defaults to a token fetched with [`getDevicePushTokenAsync()`](#getdevicepushtokenasync).
   */
  devicePushToken?: DevicePushToken;
}
