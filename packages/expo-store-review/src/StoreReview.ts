import { deprecate } from '@unimodules/core';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import StoreReview from './ExpoStoreReview';

/*
 * Determine if the platform has the capabilities to use `requestedReview`
 * iOS: `true` if iOS 10.3 or greater and the StoreKit framework is linked
 * Android: Always `true` (open URL to app store)
 * Web: Always `false`
 */
export async function isAvailableAsync(): Promise<boolean> {
  return StoreReview.isAvailableAsync();
}

/*
 * Deprecated
 */
export function isSupported(): void {
  deprecate('expo-store-review', 'StoreReview.isSupported', {
    replacement: 'StoreReview.isAvailableAsync',
  });
}

/*
 * Use the iOS `SKStoreReviewController` API to prompt a user rating without leaving the app,
 * or open a web browser to the play store on Android
 */
export async function requestReview(): Promise<void> {
  if (StoreReview && StoreReview.requestReview) {
    await StoreReview.requestReview();
  } else {
    // If StoreReview is unavailable then get the store URL from `app.json` and open the store
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
}

/*
 * Get your app's store URLs from the `app.json`
 * iOS: https://docs.expo.io/versions/latest/workflow/configuration#appstoreurlurl-to-your-app-on-the-apple-app-store-if-you-have-deployed-it-there-this-is-used-to-link-to-your-store-page-from-your-expo-project-page-if-your-app-is-public
 * Android: https://docs.expo.io/versions/latest/workflow/configuration#playstoreurlurl-to-your-app-on-the-google-play-store-if-you-have-deployed-it-there-this-is-used-to-link-to-your-store-page-from-your-expo-project-page-if-your-app-is-public
 */
export function storeUrl(): string | null {
  const { manifest } = Constants;
  // eslint-disable-next-line no-undef
  if (Platform.OS === 'ios' && manifest?.ios) {
    return manifest.ios.appStoreUrl;
    // eslint-disable-next-line no-undef
  } else if (Platform.OS === 'android' && manifest?.android) {
    return manifest.android.playStoreUrl;
  } else {
    return null;
  }
}

/*
 * A flag to detect if this module can do anything
 */
export async function hasAction(): Promise<boolean> {
  return !!storeUrl() || (await isAvailableAsync());
}
