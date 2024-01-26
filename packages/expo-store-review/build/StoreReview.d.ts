/**
 * Determines if the platform has the capabilities to use `StoreReview.requestReview()`.
 * @return
 * This returns a promise fulfills with `boolean`, depending on the platform:
 * - On iOS, it will resolve to `true` unless the app is distributed through TestFlight.
 * - On Android, it will resolve to `true` if the device is running Android 5.0+.
 * - On Web, it will resolve to `false`.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * In ideal circumstances this will open a native modal and allow the user to select a star rating
 * that will then be applied to the App Store, without leaving the app. If the device is running
 * a version of Android lower than 5.0, this will attempt to get the store URL and link the user to it.
 */
export declare function requestReview(): Promise<void>;
/**
 * This uses the `Constants` API to get the `Constants.expoConfig.ios.appStoreUrl` on iOS, or the
 * `Constants.expoConfig.android.playStoreUrl` on Android.
 *
 * On Web this will return `null`.
 */
export declare function storeUrl(): string | null;
/**
 * @return This returns a promise that fulfills to `true` if `StoreReview.requestReview()` is capable
 * directing the user to some kind of store review flow. If the app config (`app.json`) does not
 * contain store URLs and native store review capabilities are not available then the promise
 * will fulfill to `false`.
 *
 * @example
 * ```ts
 * if (await StoreReview.hasAction()) {
 *   // you can call StoreReview.requestReview()
 * }
 * ```
 */
export declare function hasAction(): Promise<boolean>;
//# sourceMappingURL=StoreReview.d.ts.map