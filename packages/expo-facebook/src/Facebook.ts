import { UnavailabilityError } from '@unimodules/core';

import ExponentFacebook from './ExponentFacebook';

export type FacebookLoginResult =
  | {
      type: 'cancel';
    }
  | {
      type: 'success';
      token: string;
      expires: number;
      permissions: string[];
      declinedPermissions: string[];
    };

export type FacebookOptions = {
  permissions?: string[];
};

export async function logInWithReadPermissionsAsync(
  options?: FacebookOptions
): Promise<FacebookLoginResult> {
  if (!ExponentFacebook.logInWithReadPermissionsAsync) {
    throw new UnavailabilityError('Facebook', 'logInWithReadPermissionsAsync');
  }

  if (!options || typeof options !== 'object') {
    options = {};
  }

  return ExponentFacebook.logInWithReadPermissionsAsync(options);
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
export async function setAutoLogAppEventsEnabledAsync(enabled: boolean) {
  if (!ExponentFacebook.setAutoLogAppEventsEnabledAsync) {
    throw new UnavailabilityError('Facebook', 'setAutoLogAppEventsEnabledAsync');
  }
  return await ExponentFacebook.setAutoLogAppEventsEnabledAsync(enabled);
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
export async function setAutoInitEnabledAsync(enabled: boolean) {
  if (!ExponentFacebook.setAutoInitEnabledAsync) {
    throw new UnavailabilityError('Facebook', 'setAutoInitEnabledAsync');
  }
  return await ExponentFacebook.setAutoInitEnabledAsync(enabled);
}

/**
 * Calling this method ensures that the SDK is initialized.
 * You have to call this method before calling `logInWithReadPermissionsAsync`
 * to ensure that Facebook support is initialized properly.
 *
 * You may or may not provide an optional `appId: string` argument.
 * - If you don't provide it, Facebook SDK will try to use `appId` from native app resources,
 *   If it fails to find one, the promise will be rejected.
 * - If you provide an explicit `appId`, it will override any other source.
 * The same resolution mechanism is applied to `appName`.
 * @param appId An optional Facebook App ID argument
 * @param appName An optional Facebook App Name argument
 */
export async function initializeAsync(appId: string | undefined, appName: string | undefined) {
  if (!ExponentFacebook.initializeAsync) {
    throw new UnavailabilityError('Facebook', 'initializeAsync');
  }
  return await ExponentFacebook.initializeAsync(appId, appName);
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
export async function setAdvertiserIDCollectionEnabledAsync(enabled: boolean) {
  if (!ExponentFacebook.setAdvertiserIDCollectionEnabledAsync) {
    throw new UnavailabilityError('Facebook', 'setAdvertiserIDCollectionEnabledAsync');
  }
  return await ExponentFacebook.setAdvertiserIDCollectionEnabledAsync(enabled);
}
