import { UnavailabilityError } from '@unimodules/core';

import ExponentFacebook from './ExponentFacebook';
import {
  FacebookAuthenticationCredential,
  FacebookLoginResult,
  FacebookOptions,
  FacebookInitializationOptions,
} from './Facebook.types';

export { FacebookLoginResult, FacebookOptions, FacebookAuthenticationCredential };

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
 * Sets whether Facebook SDK should autoinitialize itself. SDK initialization involves eg.
 * fetching app settings from Facebook or a profile of the logged in user.
 * In some cases, you may want to disable or delay the SDK initialization,
 * such as to obtain user consent or fulfill legal obligations.
 *
 * This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-sdk-initialization)
 * and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-sdk-initialization) native SDK methods.
 *
 * Note: Even though calling this method with `enabled == true` initialized the Facebook SDK on iOS,
 * it does not on Android and we recommend always calling `initializeAsync` before performing
 * any actions with effects that should be visible to the user (like `loginWithPermissions`).
 *
 * @param enabled Whether autoinitialization of the Facebook SDK should be enabled
 */
export async function setAutoInitEnabledAsync(enabled: boolean): Promise<void> {
  if (!ExponentFacebook.setAutoInitEnabledAsync) {
    throw new UnavailabilityError('Facebook', 'setAutoInitEnabledAsync');
  }
  await ExponentFacebook.setAutoInitEnabledAsync(enabled);
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
