import { UnavailabilityError } from '@unimodules/core';
import { PermissionResponse, PermissionStatus, PermissionExpiration } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExponentFacebook from './ExponentFacebook';
import {
  FacebookAuthenticationCredential,
  FacebookLoginResult,
  FacebookOptions,
  FacebookInitializationOptions,
} from './Facebook.types';

export {
  FacebookLoginResult,
  FacebookOptions,
  FacebookAuthenticationCredential,
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
};

type Params = { [key: string]: string | number };

/**
 * Info about a user to increase chances of matching a Facebook user.
 * See https://developers.facebook.com/docs/app-events/advanced-matching for
 * more info about the expected format of each field.
 */
export type UserData = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'm' | 'f';
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

const androidPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return Promise.resolve(androidPermissionsResponse);
  }

  if (!ExponentFacebook.requestPermissionsAsync) {
    throw new UnavailabilityError('Facebook', 'requestPermissionsAsync');
  }
  return await ExponentFacebook.requestPermissionsAsync();
}

export async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return Promise.resolve(androidPermissionsResponse);
  }

  if (!ExponentFacebook.getPermissionsAsync) {
    throw new UnavailabilityError('Facebook', 'getPermissionsAsync');
  }
  return await ExponentFacebook.getPermissionsAsync();
}

export async function logInWithReadPermissionsAsync(
  options: FacebookOptions = {}
): Promise<FacebookLoginResult> {
  if (!ExponentFacebook.logInWithReadPermissionsAsync) {
    throw new UnavailabilityError('Facebook', 'logInWithReadPermissionsAsync');
  }

  const nativeLoginResult = await ExponentFacebook.logInWithReadPermissionsAsync(options);

  return transformNativeFacebookLoginResult(nativeLoginResult);
}

/**
 * Returns the `FacebookAuthenticationCredential` object if a user is authenticated, and `null` if no valid authentication exists.
 *
 * You can use this method to check if the user should sign in or not.
 */
export async function getAuthenticationCredentialAsync(): Promise<FacebookAuthenticationCredential | null> {
  if (!ExponentFacebook.getAuthenticationCredentialAsync) {
    throw new UnavailabilityError('Facebook', 'getAuthenticationCredentialAsync');
  }

  const nativeAccessTokenResult = await ExponentFacebook.getAuthenticationCredentialAsync();

  return transformNativeFacebookAuthenticationCredential(nativeAccessTokenResult);
}

/**
 * Logs out of the currently authenticated session.
 */
export async function logOutAsync(): Promise<void> {
  if (!ExponentFacebook.logOutAsync) {
    throw new UnavailabilityError('Facebook', 'logOutAsync');
  }

  await ExponentFacebook.logOutAsync();
}

/**
 * Sets whether Facebook SDK should enable advertising tracking,
 * (more info [here](https://developers.facebook.com/docs/app-events/guides/advertising-tracking-enabled)).
 *
 * Limitations:
 * 1. AdvertiserTrackingEnabled is only available for iOS 14+.
 * 2. For iOS 13 or earlier, AdvertiserTrackingEnabled uses the Limit Ad Tracking setting as its value.
 *
 * This method corresponds to [this](https://developers.facebook.com/docs/app-events/guides/advertising-tracking-enabled)
 *
 * @param enabled Whether advertising tracking of the Facebook SDK should be enabled
 * @return Whether the value is set successfully. It will always return false in Android, iOS 13 and below.
 */
export async function setAdvertiserTrackingEnabledAsync(enabled: boolean): Promise<boolean> {
  if (!ExponentFacebook.setAdvertiserTrackingEnabledAsync) {
    return false;
  }
  return await ExponentFacebook.setAdvertiserTrackingEnabledAsync(enabled);
}

/**
 * Sets whether Facebook SDK should log app events. App events involve eg. app installs,
 * app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events)
 * and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)).
 *
 * In some cases, you may want to disable or delay the collection of automatically logged events,
 * such as to obtain user consent or fulfill legal obligations.
 *
 * This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events)
 * and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK methods.
 *
 * @param enabled Whether automatic events logging of the Facebook SDK should be enabled
 */
export async function setAutoLogAppEventsEnabledAsync(enabled: boolean): Promise<void> {
  if (!ExponentFacebook.setAutoLogAppEventsEnabledAsync) {
    throw new UnavailabilityError('Facebook', 'setAutoLogAppEventsEnabledAsync');
  }
  await ExponentFacebook.setAutoLogAppEventsEnabledAsync(enabled);
}

/**
 * @deprecated Explicitly call `initializeAsync` instead.
 */
export async function setAutoInitEnabledAsync(enabled: boolean): Promise<void> {
  console.warn(
    'The `autoInitEnabled` option has been removed from Facebook SDK — we recommend to explicitly use `initializeAsync` instead.'
  );
}

/**
 * Calling this method ensures that the SDK is initialized.
 * You have to call this method before calling any method that uses
 * the FBSDK (ex: `logInWithReadPermissionsAsync`, `logOutAsync`) to ensure that
 * Facebook support is initialized properly.
 *
 * - On Android and iOS you can optionally provide an `appId` argument.
 *   - If you don't provide `appId`, the Facebook SDK will try to use `appId` from native app resources (which in standalone apps you define in `app.json`, in app store development clients are unavailable, and in bare apps you configure yourself according to [Facebook's setup documentation for iOS](https://developers.facebook.com/docs/facebook-login/ios#4--configure-your-project) and [Android](https://developers.facebook.com/docs/facebook-login/android#manifest)). If the Facebook SDK fails to find an `appId` value, the returned promise will be rejected.
 *   - The same resolution mechanism works for `appName`.
 * - If you provide an explicit `appId`, it will override any other source.
 *
 * @param options The options used to configure how Facebook is initialized
 */
export async function initializeAsync(
  optionsOrAppId: FacebookInitializationOptions | string,
  appName?: string
): Promise<void> {
  if (!ExponentFacebook.initializeAsync) {
    throw new UnavailabilityError('Facebook', 'initializeAsync');
  }

  let options: FacebookInitializationOptions = {};

  if (typeof optionsOrAppId === 'string') {
    options.appId = optionsOrAppId;
    options.appName = appName;
    console.warn(
      'The parameters of `initializeAsync(appId, appName)` have changed to support future platforms, you must now provide an object instead: initializeAsync({ appId, appName }).'
    );
  } else {
    options = optionsOrAppId;
  }

  await ExponentFacebook.initializeAsync(options);
}

/**
 * Whether the Facebook SDK should collect advertiser ID properties, like the Apple IDFA
 * and Android Advertising ID, automatically. Advertiser IDs let you identify and target specific customers.
 * To learn more visit [Facebook documentation](https://developers.facebook.com/docs/app-ads/targeting/mobile-advertiser-ids)
 * describing that topic.
 *
 * In some cases, you may want to disable or delay the collection of `advertiser-id`,
 * such as to obtain user consent or fulfill legal obligations.
 *
 * This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-advertiser-id)
 * and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-advertiser-id) native SDK methods.
 * @param enabled Whether `advertiser-id` should be collected
 */
export async function setAdvertiserIDCollectionEnabledAsync(enabled: boolean): Promise<void> {
  if (!ExponentFacebook.setAdvertiserIDCollectionEnabledAsync) {
    throw new UnavailabilityError('Facebook', 'setAdvertiserIDCollectionEnabledAsync');
  }
  await ExponentFacebook.setAdvertiserIDCollectionEnabledAsync(enabled);
}

function transformNativeFacebookLoginResult(input: FacebookLoginResult): FacebookLoginResult {
  if (input.type === 'cancel') return input;

  return {
    ...input,
    refreshDate:
      typeof input.refreshDate === 'number' ? new Date(input.refreshDate) : input.refreshDate,
    dataAccessExpirationDate: new Date(input.dataAccessExpirationDate),
    expirationDate: new Date(input.expirationDate),
  };
}

function transformNativeFacebookAuthenticationCredential(
  input: any
): FacebookAuthenticationCredential | null {
  if (!input) return input;
  return {
    ...input,
    refreshDate:
      typeof input.refreshDate === 'number' ? new Date(input.refreshDate) : input.refreshDate,
    dataAccessExpirationDate: new Date(input.dataAccessExpirationDate),
    expirationDate: new Date(input.expirationDate),
  };
}

/**
 * Logs an event with eventName and optional parameters. Supports the optional parameter `valueToSum`,
 * which when reported, all of the valueToSum properties are summed together. For example, if 10 people purchased
 * one item and each item cost $10 (and passed in valueToSum) then they would be added together to report $100.
 * Parameters must be either strings or numbers, otherwise no event will be logged.
 *
 * To view and test app events, please visit Facebook's Event Manager- https://www.facebook.com/events_manager2/list/app/
 */
export async function logEventAsync(eventName: string, parameters: Params = {}): Promise<void> {
  if (!ExponentFacebook.logEventAsync) {
    throw new UnavailabilityError('Facebook', 'logEventAsync');
  }
  let valueToSum: number = 0;
  if (parameters.hasOwnProperty('valueToSum')) {
    valueToSum = Number(parameters.valueToSum);
    delete parameters.valueToSum;
  }
  return await ExponentFacebook.logEventAsync(eventName, valueToSum, parameters);
}

/**
 * Logs a purchase event with the amount, currency code, and optional parameters.
 * Parameters must be either strings or numbers, otherwise no event will be logged.
 * See http://en.wikipedia.org/wiki/ISO_4217 for currencyCodes.
 */
export async function logPurchaseAsync(
  purchaseAmount: number,
  currencyCode: string,
  parameters?: Params
): Promise<void> {
  if (!ExponentFacebook.logPurchaseAsync) {
    throw new UnavailabilityError('Facebook', 'logPurchaseAsync');
  }
  return await ExponentFacebook.logPurchaseAsync(purchaseAmount, currencyCode, parameters);
}

/**
 * Logs an app event that tracks that the application was opened via Push Notification. Accepts
 * a string describing the campaign of the Push Notification.
 */
export async function logPushNotificationOpenAsync(campaign: string): Promise<void> {
  if (!ExponentFacebook.logPushNotificationOpenAsync) {
    throw new UnavailabilityError('Facebook', 'logPushNotificationOpenAsync');
  }
  return await ExponentFacebook.logPushNotificationOpenAsync(campaign);
}

/**
 * Explicitly kicks off flushing of events to Facebook.
 */
export async function flushAsync(): Promise<void> {
  if (!ExponentFacebook.flushAsync) {
    throw new UnavailabilityError('Facebook', 'flushAsync');
  }
  return await ExponentFacebook.flushAsync();
}

/**
 * Sets a custom user ID to associate with all app events.
 * The userID is persisted until it is cleared by passing nil.
 */
export async function setUserIDAsync(userID: string | null): Promise<void> {
  if (!ExponentFacebook.setUserIDAsync) {
    throw new UnavailabilityError('Facebook', 'setUserIDAsync');
  }
  return await ExponentFacebook.setUserIDAsync(userID);
}

/**
 * @return A promise fulfilled with the user id or null if not set.
 */
export async function getUserIDAsync(): Promise<string | null> {
  if (!ExponentFacebook.getUserIDAsync) {
    throw new UnavailabilityError('Facebook', 'getUserIDAsync');
  }
  return await ExponentFacebook.getUserIDAsync();
}

/**
 * @return A promise fulfilled with an anonymous id or null if not set.
 */
export async function getAnonymousIDAsync(): Promise<string | null> {
  if (!ExponentFacebook.getAnonymousIDAsync) {
    throw new UnavailabilityError('Facebook', 'getAnonymousIDAsync');
  }
  return await ExponentFacebook.getAnonymousIDAsync();
}

/**
 * @return A promise fulfilled with the advertiser id or null if not set.
 */
export async function getAdvertiserIDAsync(): Promise<string | null> {
  if (!ExponentFacebook.getAdvertiserIDAsync) {
    throw new UnavailabilityError('Facebook', 'getAdvertiserIDAsync');
  }
  return await ExponentFacebook.getAdvertiserIDAsync();
}

/**
 * **Android only.**
 * @return A promise fulfilled with the attribution id or null if not set.
 */
export async function getAttributionIDAsync(): Promise<string | null> {
  if (!ExponentFacebook.getAttributionIDAsync) {
    throw new UnavailabilityError('Facebook', 'getAttributionIDAsync');
  }
  return await ExponentFacebook.getAttributionIDAsync();
}

/**
 * Sets additional data about the user to increase the chances of matching a Facebook user.
 */
export async function setUserDataAsync(userData: UserData): Promise<void> {
  if (!ExponentFacebook.setUserDataAsync) {
    throw new UnavailabilityError('Facebook', 'setUserDataAsync');
  }
  return await ExponentFacebook.setUserDataAsync(userData);
}
