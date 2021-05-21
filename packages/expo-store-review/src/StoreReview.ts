import { Platform } from '@unimodules/core';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

import StoreReview from './ExpoStoreReview';

// @needsAudit
/**
 * Determines if the platform has the capabilities to use `StoreReview.requestReview()`.
 * @return
 * This returns a promise fulfills with `boolean`, depending on the platform:
 * - On iOS, it will resolve to `true` if the device is running iOS 10.3+.
 * - On Android, it will resolve to `true` if the device is running Android 5.0+.
 * - On Web, it will resolve to `false`.
 */
export async function isAvailableAsync(): Promise<boolean> {
  return StoreReview.isAvailableAsync();
}

// @needsAudit
/**
 * In ideal circumstances this will open a native modal and allow the user to select a star rating
 * that will then be applied to the App Store, without leaving the app. If the device is running
 * a version of iOS lower than 10.3, or a version of Android lower than 5.0, this will attempt
 * to get the store URL and link the user to it.
 * 
 * Google and Apple both rate limit the frequency of requests for reviews
 * using this method, so you'll want to be thoughtful before calling this. See 
 * [Rate Limits](#rate-limits) below for more. The most common way to avoid 
 * hitting these rate limits is to ask the user if they'd like to review your 
 * app with your own dialog before calling the `requestReview` method.
 * 
 */
export async function requestReview(): Promise<void> {
  if (StoreReview?.requestReview) {
    await StoreReview.requestReview();
    return;
  }
  // If StoreReview is unavailable then get the store URL from `app.config.js` or `app.json` and open the store
  const url = storeUrl();
  if (url) {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      console.warn("Expo.StoreReview.requestReview(): Can't open store url: ", url);
    } else {
      await Linking.openURL(url);
    }
  } else {
    // If the store URL is missing, let the dev know.
    console.warn(
      "Expo.StoreReview.requestReview(): Couldn't link to store, please make sure the `android.playStoreUrl` & `ios.appStoreUrl` fields are filled out in your `app.json`"
    );
  }
}

// @needsAudit
/**
 * This uses the `Constants` API to get the `Constants.manifest.ios.appStoreUrl` on iOS, or the
 * `Constants.manifest.android.playStoreUrl` on Android.
 *
 * On Web this will return `null`.
 */
export function storeUrl(): string | null {
  const { manifest } = Constants;
  // eslint-disable-next-line no-undef
  if (Platform.OS === 'ios' && manifest?.ios) {
    return manifest.ios.appStoreUrl ?? null;
    // eslint-disable-next-line no-undef
  } else if (Platform.OS === 'android' && manifest?.android) {
    return manifest.android.playStoreUrl ?? null;
  }
  return null;
}

// @needsAudit
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
export async function hasAction(): Promise<boolean> {
  return !!storeUrl() || (await isAvailableAsync());
}
