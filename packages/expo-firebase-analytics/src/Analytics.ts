import { UnavailabilityError } from 'expo-modules-core';

import ExpoFirebaseAnalytics from './ExpoFirebaseAnalytics';
export { default as FirebaseAnalyticsJS } from './FirebaseAnalyticsJS';

if (!ExpoFirebaseAnalytics) {
  console.warn(
    "No native ExpoFirebaseAnalytics module found, are you sure the expo-firebase-analytics's module is linked properly?"
  );
}

// @needsAudit
/**
 * Logs an app event. The event can have up to 25 parameters. Events with the same name must have
 * the same parameters. Up to 500 event names are supported. Using predefined events and/or
 * parameters is recommended for optimal reporting. See [the Google Analytics event reference](https://developers.google.com/gtagjs/reference/event)
 * for a list of all predefined events.
 *
 * > The following event names are reserved for the native SDKs automatic collection and cannot be used: `ad_activeview, ad_click, ad_exposure, ad_query, ad_reward, adunit_exposure, app_background, app_clear_data, app_exception, app_remove, app_store_refund, app_store_subscription_cancel, ad_activeview, ad_click, ad_exposure, ad_query, ad_reward, adunit_exposure, app_background, app_clear_data, app_exception, app_remove, app_store_refund, app_store_subscription_cancel, app_store_subscription_convert, app_store_subscription_renew, app_update, app_upgrade, dynamic_link_app_open, dynamic_link_app_update, dynamic_link_first_open, error, firebase_campaign, first_open, first_visit, in_app_purchase, notification_dismiss, notification_foreground, notification_open, notification_receive, os_update, session_start, session_start_with_rollout, user_engagement`
 *
 * @example
 * ```ts
 * await Analytics.logEvent('add_to_cart', {
 *   currency: 'USD',
 *   value: 29.98
 *   items: [{
 *     id: "P12345",
 *     name: "Expo Warhol T-Shirt",
 *     brand: "Expo",
 *     category: "Apparel/T-Shirts",
 *     coupon: "SUMMER_DISCOUNT",
 *     list_name: "Search Results",
 *     list_position: 1,
 *     price: 14.99,
 *     quantity: 2,
 *     variant: "Blue"
 *   }]
 * });
 * ```
 *
 * @param name The name of the event. Should contain 1 to 40 alphanumeric characters or underscores.
 * The name must start with an alphabetic character. Some event names are  reserved. The `firebase_`,
 * `google_`, and `ga_` prefixes are reserved and should not be used. Note that event names are
 * case-sensitive and that logging two events whose names differ only in case will result in two
 * distinct events. To manually log screen view events, use the `screen_view` event name.
 * @param properties The dictionary of event parameters. Passing `undefined` indicates that the
 * event has no parameters. Parameter names can be up to 40 characters long and must start with an
 * alphabetic character and contain only alphanumeric characters and underscores. Only `String` and
 * `Number` parameter types are supported; and `items` arrays containing dictionaries.
 * `String` parameter values can be up to 100 characters long. The `firebase_`,  `google_`, and
 * `ga_` prefixes are reserved and should not be used for parameter names.
 */
export async function logEvent(name: string, properties?: Record<string, any>): Promise<void> {
  if (!ExpoFirebaseAnalytics.logEvent) {
    throw new UnavailabilityError('expo-firebase-analytics', 'logEvent');
  }
  return await ExpoFirebaseAnalytics.logEvent(name, properties);
}

// @needsAudit
/**
 * Sets whether analytics collection is enabled for this app on this device. This setting is
 * persisted across app sessions. __By default it is enabled__.
 *
 * @param isEnabled A flag that enables or disables Analytics collection.
 */
export async function setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void> {
  if (!ExpoFirebaseAnalytics.setAnalyticsCollectionEnabled) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setAnalyticsCollectionEnabled');
  }
  return await ExpoFirebaseAnalytics.setAnalyticsCollectionEnabled(isEnabled);
}

// @needsAudit
/**
 * Sets the interval of inactivity in seconds that terminates the current session. The default
 * value is 1800000 milliseconds (30 minutes).
 *
 * > Setting the session timeout only applies to the native iOS and Android SDKs. Calling this
 * > method does nothing on Expo Go or web.
 *
 * @param sessionTimeoutInterval The custom time of inactivity in milliseconds before the current
 * session terminates.
 */
export async function setSessionTimeoutDuration(sessionTimeoutInterval: number): Promise<void> {
  if (!ExpoFirebaseAnalytics.setSessionTimeoutDuration) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setSessionTimeoutDuration');
  }
  return await ExpoFirebaseAnalytics.setSessionTimeoutDuration(sessionTimeoutInterval);
}

// @needsAudit
/**
 * Sets the user ID property. This feature must be used in accordance with [Google's Privacy Policy](https://www.google.com/policies/privacy)
 *
 * @param userId The user ID to ascribe to the user of this app on this device, which must be
 * non-empty and no more than 256 characters long. Setting userID to null removes the user ID.
 */
export async function setUserId(userId: string | null): Promise<void> {
  if (!ExpoFirebaseAnalytics.setUserId) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setUserId');
  }
  return await ExpoFirebaseAnalytics.setUserId(userId);
}

// @needsAudit
/**
 * Sets a user property to a given value. Up to 25 user property names are supported. Once set,
 * user property values persist throughout the app life-cycle and across sessions.
 *
 * The following user property names are reserved and cannot be used:
 * - `first_open_time`
 * - `last_deep_link_referrer`
 * - `user_id`
 *
 * @example
 * ```ts
 * await Analytics.setUserProperty('favorite_batmobile', '1989 Burton-mobile');
 * ```
 *
 * @param name The name of the user property to set. Should contain 1 to 24 alphanumeric characters
 * or underscores and must start with an alphabetic character. The `firebase_`, `google_`, and
 * `ga_` prefixes are reserved and should not be used for user property names.
 * @param value The value of the user property. Values can be up to 36 characters long. Setting the
 * value to null removes the user property.
 */
export async function setUserProperty(name: string, value: string | null): Promise<void> {
  return await setUserProperties({ [name]: value });
}

// @needsAudit
/**
 * Clears all analytics data for this instance from the device and resets the app instance ID.
 */
export async function resetAnalyticsData(): Promise<void> {
  if (!ExpoFirebaseAnalytics.resetAnalyticsData) {
    throw new UnavailabilityError('expo-firebase-analytics', 'resetAnalyticsData');
  }
  return await ExpoFirebaseAnalytics.resetAnalyticsData();
}

// @needsAudit
/**
 * Sets multiple user properties to the supplied values.
 *
 * @example
 * ```ts
 * await Analytics.setUserProperties({
 *   loves_expo: 'a lot',
 * });
 * ```
 *
 * @param properties Key/value set of user properties. Values can be up to 36 characters long.
 * Setting the value to null removes the user property.
 */
export async function setUserProperties(properties: Record<string, string | null>): Promise<void> {
  if (!ExpoFirebaseAnalytics.setUserProperties) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setUserProperties');
  }
  return await ExpoFirebaseAnalytics.setUserProperties(properties);
}

// @needsAudit
/**
 * Enables or disables the warning and log messages when using Firebase Analytics on the Expo client.
 *
 * Firebase Analytics is not available on the Expo client and therefore logs the requests to the
 * console for development purposes. To test Firebase Analytics, create a standalone build or custom
 * client. Use this function to suppress the warning and log messages.
 *
 * @param isEnabled A flag that enables or disables unavailability logging.
 */
export function setUnavailabilityLogging(isEnabled: boolean): void {
  if (!ExpoFirebaseAnalytics.setUnavailabilityLogging) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setUnavailabilityLogging');
  }
  ExpoFirebaseAnalytics.setUnavailabilityLogging(isEnabled);
}

// @needsAudit
/**
 * Sets the clientId to the given value. For best results, set this value before
 * calling any other functions on this module.
 *
 * By default, the clientId is set to `Constants.installationId` in Expo Go, which is deprecated and
 * will be removed in SDK 44. At that time, this method will need to be used to set the `clientId`
 * when using Expo Go.
 *
 * @param clientId UUIDv4 string value to set for the current session in Expo Go.
 * @platform expo
 */
export function setClientId(clientId: string): void {
  if (!ExpoFirebaseAnalytics.setClientId) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setClientId');
  }
  ExpoFirebaseAnalytics.setClientId(clientId);
}

/**
 * Enables or disabled debug mode on the Expo client, so events can
 * be tracked using the [DebugView in the Analytics dashboard](https://firebase.google.com/docs/analytics/debugview#reporting).
 *
 * This option is only available in Expo Go. When using a custom development app, a standalone app,
 * the bare workflow or web, use the [natively available options](https://firebase.google.com/docs/analytics/debugview).
 *
 * @param isEnabled A flag that enables or disables debug mode.
 * @platform expo
 */
export async function setDebugModeEnabled(isEnabled: boolean): Promise<void> {
  if (!ExpoFirebaseAnalytics.setDebugModeEnabled) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setDebugModeEnabled');
  }
  return await ExpoFirebaseAnalytics.setDebugModeEnabled(isEnabled);
}
