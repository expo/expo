// @docsMissing
/**
 * @platform ios
 */
export enum ApplicationReleaseType {
  UNKNOWN = 0,
  SIMULATOR = 1,
  ENTERPRISE = 2,
  DEVELOPMENT = 3,
  AD_HOC = 4,
  APP_STORE = 5,
}

/**
 * Maps to the [`aps-environment`](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment) key in the native target's registered entitlements.
 * @platform ios
 */
export type PushNotificationServiceEnvironment = 'development' | 'production' | null;

/**
 * Maps to StoreKit's
 * [`AppStore.Environment`](https://developer.apple.com/documentation/storekit/appstore/environment),
 * as reported by the app's
 * [`AppTransaction.environment`](https://developer.apple.com/documentation/storekit/apptransaction/environment).
 * - `'production'`: An App Store release.
 * - `'sandbox'`: A TestFlight build, a build under App Store Review, or a development, ad hoc, or
 *   enterprise-signed build.
 * - `'xcode'`: A build run with a StoreKit configuration file in Xcode.
 * - `null`: StoreKit returns no verified app transaction, or an environment that this version does
 *   not recognize. A missing transaction happens on a simulator without a StoreKit configuration
 *   file, or when the user is offline or signed out of the App Store before StoreKit caches one.
 * @platform ios
 * @platform tvos
 */
export type AppleAppStoreEnvironment = 'production' | 'sandbox' | 'xcode' | null;
