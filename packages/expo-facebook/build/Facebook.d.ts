import { PermissionResponse, PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';
import { FacebookAuthenticationCredential, FacebookLoginResult, FacebookOptions, FacebookInitializationOptions } from './Facebook.types';
export { FacebookLoginResult, FacebookOptions, FacebookAuthenticationCredential, PermissionResponse, PermissionStatus, PermissionExpiration, };
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
export declare function logInWithReadPermissionsAsync(options?: FacebookOptions): Promise<FacebookLoginResult>;
/**
 * Returns the `FacebookAuthenticationCredential` object if a user is authenticated, and `null` if no valid authentication exists.
 *
 * You can use this method to check if the user should sign in or not.
 */
export declare function getAuthenticationCredentialAsync(): Promise<FacebookAuthenticationCredential | null>;
/**
 * Logs out of the currently authenticated session.
 */
export declare function logOutAsync(): Promise<void>;
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
export declare function setAdvertiserTrackingEnabledAsync(enabled: boolean): Promise<boolean>;
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
export declare function setAutoLogAppEventsEnabledAsync(enabled: boolean): Promise<void>;
/**
 * @deprecated Explicitly call `initializeAsync` instead.
 */
export declare function setAutoInitEnabledAsync(enabled: boolean): Promise<void>;
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
export declare function initializeAsync(optionsOrAppId: FacebookInitializationOptions | string, appName?: string): Promise<void>;
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
export declare function setAdvertiserIDCollectionEnabledAsync(enabled: boolean): Promise<void>;
