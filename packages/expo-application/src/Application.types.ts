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
 * The store environment the app was installed from, read from StoreKit's [`AppTransaction.environment`](https://developer.apple.com/documentation/storekit/apptransaction/environment).
 * - `'appStore'`: Installed from the App Store.
 * - `'testFlight'`: Installed from TestFlight, or running in App Store Review. StoreKit reports both as the sandbox environment.
 * - `'development'`: Installed from Xcode or a development build.
 * - `'unknown'`: StoreKit returned no verified transaction, such as on a simulator without a StoreKit configuration.
 * @platform ios
 * @platform tvos
 */
export type StoreEnvironment = 'appStore' | 'testFlight' | 'development' | 'unknown';
