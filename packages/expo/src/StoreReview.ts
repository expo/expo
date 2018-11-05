import { NativeModules, Platform, Linking } from 'react-native';
import { Constants } from 'expo-constants';

/*
    * Platform must be iOS
    * iOS 10.3 or greater
    * `SKStoreReviewController` class is available
*/
export function isSupported() {
  return Platform.OS === 'ios' && NativeModules.ExponentStoreReview.isSupported;
}

/*
    Use the iOS `SKStoreReviewController` API to prompt a user rating without leaving the app.
*/
export function requestReview() {
  if (isSupported()) {
    NativeModules.ExponentStoreReview.requestReview();
  } else {
    /*
       If StoreReview is unavailable then get the store URL from the `app.json` and open to the store.
    */
    const url = storeUrl();
    if (url) {
      Linking.canOpenURL(url)
        .then(supported => {
          if (!supported) {
            console.log("Expo.StoreReview.requestReview(): Can't open store url: ", url);
            return;
          } else {
            return Linking.openURL(url);
          }
        })
        .catch(err =>
          console.warn('Expo.StoreReview.requestReview(): Error opening link to store: ', err)
        );
    } else {
      // If the store URL is missing, let the dev know.
      console.log(
        "Expo.StoreReview.requestReview(): Couldn't link to store, please make sure the `android.playStoreUrl` & `ios.appStoreUrl` fields are filled out in your `app.json`"
      );
    }
  }
}

/*
    Get your app's store URLs from the `app.json`

    * iOS: https://docs.expo.io/versions/latest/workflow/configuration#appstoreurlurl-to-your-app-on-the-apple-app-store-if-you-have-deployed-it-there-this-is-used-to-link-to-your-store-page-from-your-expo-project-page-if-your-app-is-public
    * Android: https://docs.expo.io/versions/latest/workflow/configuration#playstoreurlurl-to-your-app-on-the-google-play-store-if-you-have-deployed-it-there-this-is-used-to-link-to-your-store-page-from-your-expo-project-page-if-your-app-is-public
*/
export function storeUrl() {
  const { OS } = Platform;
  if (OS === 'ios') {
    return Constants.manifest.ios.appStoreUrl;
  } else if (OS === 'android') {
    return Constants.manifest.android.playStoreUrl;
  } else {
    console.warn(`Expo.StoreReview.storeUrl(): Unsupported OS: ${OS}`);
  }
  return null;
}

/*
    A flag to detect if this module can do anything
*/
export function hasAction() {
  return !!storeUrl() || isSupported();
}
