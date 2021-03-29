/**
 * Determines if the platform has the capabilities to use `StoreReview.requestReview()`.
 * @return
 * - On iOS, this will return `true` if the device is running iOS 10.3+.
 * - On Android, this will return `true` if the device is running Android 5.0+.
 * - On Web, this will return `false`.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * In the ideal circumstance this will open a native modal and allow the user to select a star rating
 * that will then be applied to the App Store without leaving the app. If the users device is running
 * a version of iOS lower than 10.3, or the user is on an Android version lower than 5.0, this will
 * attempt to get the store URL and link the user to it.
 */
export declare function requestReview(): Promise<void>;
/**
 * This uses the `Constants` API to get the `Constants.manifest.ios.appStoreUrl` on iOS, or the
 * `Constants.manifest.android.playStoreUrl` on Android.
 *
 * On Web and in the bare workflow, this will return `null`.
 */
export declare function storeUrl(): string | null;
/**
 * @return This returns a promise that fulfills to `true` if `StoreReview.requestReview()` is capable
 * directing the user to some kind of store review flow. If the app config (`app.json`) does not
 * contain store URLs and native store review capabilities are not available then the promise
 * will fulfill to `false`.
 *
 * # Example
 * ```ts
 * if (await StoreReview.hasAction()) {
 *   // you can call StoreReview.requestReview()
 * }
 * ```
 */
export declare function hasAction(): Promise<boolean>;
