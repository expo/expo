---
title: Admob
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-ads-admob'
packageName: 'expo-ads-admob'
---

import { ConfigClassic, ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import { AndroidPermissions, IOSPermissions } from '~/components/plugins/permissions';
import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

> **Deprecated.** This module will be removed in SDK 46. There will be no replacement that works with the classic build service (`expo build`) because [the classic build service has been superseded by **EAS Build**](https://blog.expo.dev/turtle-goes-out-to-sea-d334db2a6b60). With **EAS Build** and [Development Builds](/development/introduction.md), you should use [react-native-google-mobile-ads](https://github.com/invertase/react-native-google-mobile-ads) instead.

Expo includes support for the [Google AdMob SDK](https://www.google.com/admob/) for mobile advertising, including components for banner ads and imperative APIs for interstitial and rewarded video ads. **`expo-ads-admob`** is largely based of the [react-native-admob](https://github.com/sbugert/react-native-admob) module, as the documentation and questions surrounding that module may prove helpful. A simple example implementing AdMob SDK can be found [here](https://github.com/deadcoder0904/expo-google-admob).

<PlatformsSection android emulator ios simulator />

## Installation

<APIInstallSection />

## Configuration in app.json / app.config.js

You can configure `expo-ads-admob` using its built-in [config plugin](../../../guides/config-plugins.md) if you use config plugins in your project ([EAS Build](../../../build/introduction.md) or `expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

For the module to attribute interactions with ads to your AdMob app properly you will need to add a `googleMobileAdsAppId` property to **app.json** under `[platform].config`. More info on where to find the app ID can be found in [this Google Support answer](https://support.google.com/admob/answer/6232340). A sample valid **app.json** would look like:

```json
{
  "expo": {
    "name": "Ads Showcase",
    // ...
    "android": {
      // ...
      "config": {
        // ...
        "googleMobileAdsAppId": "ca-app-pub-3940256099942544~3347511713" // sample id, replace with your own
      }
    },
    "ios": {
      // ...
      "config": {
        // ...
        "googleMobileAdsAppId": "ca-app-pub-3940256099942544~1458002511" // sample id, replace with your own
      }
    }
  }
}
```

<ConfigClassic>

You can configure [the permissions for this library](#permissions) using [`ios.infoPlist`](../config/app.md#infoplist) and [`android.permissions`](../config/app.md#permissions).

</ConfigClassic>

<ConfigReactNative>

Learn how to configure the native projects in the [installation instructions in the `expo-ads-admob` repository](https://github.com/expo/expo/tree/main/packages/expo-ads-admob#installation-in-bare-react-native-projects).

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "plugins": [
      [
        "expo-ads-admob",
        {
          "userTrackingPermission": "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[
{ name: 'userTrackingPermission', platform: 'ios', description: 'Sets the iOS `NSUserTrackingUsageDescription` permission message in Info.plist.', default: '"This identifier will be used to deliver personalized ads to you."' },
]} />

## Usage

```tsx
import {
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded,
  setTestDeviceIDAsync,
} from 'expo-ads-admob';

// Set global test device ID
await setTestDeviceIDAsync('EMULATOR');

// Display a banner
<AdMobBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-3940256099942544/6300978111" // Test ID, Replace with your-admob-unit-id
  servePersonalizedAds // true or false
  onDidFailToReceiveAdWithError={this.bannerError} />

// Display a DFP Publisher banner
<PublisherBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-3940256099942544/6300978111" // Test ID, Replace with your-admob-unit-id
  onDidFailToReceiveAdWithError={this.bannerError}
  onAdMobDispatchAppEvent={this.adMobEvent} />

// Display an interstitial
await AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712'); // Test ID, Replace with your-admob-unit-id
await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true});
await AdMobInterstitial.showAdAsync();

// Display a rewarded ad
await AdMobRewarded.setAdUnitID('ca-app-pub-3940256099942544/5224354917'); // Test ID, Replace with your-admob-unit-id
await AdMobRewarded.requestAdAsync();
await AdMobRewarded.showAdAsync();
```

### Testing

- Here is the full list of Test IDs
  - [iOS Test IDs](https://developers.google.com/admob/ios/test-ads)
  - [Android Test IDs](https://developers.google.com/admob/android/test-ads)
- Ensure you **never** load a real production ad in an Android Emulator or iOS Simulator. Failure to do this can result in a ban from the AdMob program.

```tsx
import * as Device from 'expo-device';

const testID = 'google-test-id';
const productionID = 'my-id';
// Is a real device and running in production.
const adUnitID = Device.isDevice && !__DEV__ ? productionID : testID;
```

## Methods

### `isAvailableAsync()`

Returns whether the AdMob API is enabled on the current device. This does not check the native configuration.

#### Returns

Async `boolean`, indicating whether the AdMob API is available on the current device. Currently this resolves `true` on iOS and Android only.

### `requestPermissionsAsync()`

Asks for permissions to use data for tracking the user or the device.

> iOS: it requires the `NSUserTrackingUsageDescription` message added to the **Info.plist**.

#### Returns

A promise that resolves to an object of type [PermissionResponse](permissions.md#permissionresponse).

### `getPermissionsAsync()`

Checks application's permissions for using data for tracking the user or the device.

> iOS: it requires the `NSUserTrackingUsageDescription` message added to the **Info.plist**.

#### Returns

A promise that resolves to an object of type [PermissionResponse](permissions.md#permissionresponse).

### setTestDeviceIDAsync(testDeviceID)

Sets the test device ID. For simulators/emulators you can use `'EMULATOR'` for the test device ID.

#### Arguments

- **testDeviceID (_string_)** -- Test device ID.

### AdMobBanner

#### servePersonalizedAds property

The default behavior of the Google Mobile Ads SDK is to serve personalized ads. If a user has consented to receive only non-personalized ads, you can configure the view to specify that only non-personalized ads should be requested. Adding `servePersonalizedAds` property causes non-personalized ads to be requested regardless of whether or not the user is in the EEA. The default is `false` — ads won't be personalized.

#### bannerSize property

_Corresponding to [iOS framework banner size constants](https://developers.google.com/admob/ios/banner)_

| Prop value                | Description                                       | Size              |
| ------------------------- | ------------------------------------------------- | ----------------- |
| `banner`                  | Standard Banner for Phones and Tablets            | 320x50            |
| `largeBanner`             | Large Banner for Phones and Tablets               | 320x100           |
| `mediumRectangle`         | IAB Medium Rectangle for Phones and Tablets       | 300x250           |
| `fullBanner`              | IAB Full-Size Banner for Tablet                   | 468x60            |
| `leaderboard`             | IAB Leaderboard for Tablets                       | 728x90            |
| **`smartBannerPortrait`** | **Smart Banner for Phones and Tablets (default)** | Screen width x 32 |
| `smartBannerLandscape`    | Smart Banner for Phones and Tablets               | Screen width x 32 |

_Note: There is no `smartBannerPortrait` and `smartBannerLandscape` on Android. Both prop values will map to `smartBanner`_

#### Events as function props

_Corresponding to [Ad lifecycle event callbacks](https://developers.google.com/admob/ios/banner)_

| Prop                                                      |
| --------------------------------------------------------- |
| `onAdViewDidReceiveAd()`                                  |
| `onDidFailToReceiveAdWithError(errorDescription: string)` |
| `onAdViewWillPresentScreen()`                             |
| `onAdViewWillDismissScreen()`                             |
| `onAdViewDidDismissScreen()`                              |

#### Test ID

```tsx
const adUnitID = Platform.select({
  // https://developers.google.com/admob/ios/test-ads
  ios: 'ca-app-pub-3940256099942544/2934735716',
  // https://developers.google.com/admob/android/test-ads
  android: 'ca-app-pub-3940256099942544/6300978111',
});
```

### AdMobInterstitials

#### Methods

| Name                      | Description                                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setAdUnitID(adUnitID)`   | sets the AdUnit ID for all future ad requests.                                                                                                                                                                                     |
| `requestAdAsync(options)` | requests an interstitial and resolves when `interstitialDidLoad` or `interstitialDidFailToLoad` event fires. An optional `options` object argument may specify `servePersonalizedAds: true` value — then ads will be personalized. |
| `showAdAsync()`           | shows an interstitial if it is ready and resolves when `interstitialDidOpen` event fires                                                                                                                                           |
| `getIsReadyAsync()`       | resolves with boolean whether interstitial is ready to be shown                                                                                                                                                                    |

#### Events

Unfortunately, events are not consistent across iOS and Android. To have one unified API, new event names are introduced for pairs that are roughly equivalent.

| iOS                                        | _this library_                     | Android               |
| ------------------------------------------ | ---------------------------------- | --------------------- |
| `interstitialDidReceiveAd`                 | `interstitialDidLoad`              | `onAdLoaded`          |
| `interstitial:didFailToReceiveAdWithError` | `interstitialDidFailToLoad`        | `onAdFailedToLoad`    |
| `interstitialWillPresentScreen`            | `interstitialDidOpen`              | `onAdOpened`          |
| `interstitialDidFailToPresentScreen`       |                                    |                       |
| `interstitialWillDismissScreen`            |                                    |                       |
| `interstitialDidDismissScreen`             | `interstitialDidClose`             | `onAdClosed`          |

_Note that `interstitialWillLeaveApplication` and `onAdLeftApplication` are not exactly the same but share one event in this library._

#### Test ID

```tsx
const adUnitID = Platform.select({
  // https://developers.google.com/admob/ios/test-ads
  ios: 'ca-app-pub-3940256099942544/4411468910',
  // https://developers.google.com/admob/android/test-ads
  android: 'ca-app-pub-3940256099942544/1033173712',
});
```

### AdMobRewarded

Opens a rewarded AdMob ad.

#### Methods

| Name                            | Description                                                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setAdUnitID(adUnitID: string)` | sets the AdUnit ID for all future ad requests.                                                                                                       |
| `requestAdAsync(options)`       | (async) requests a rewarded ad. An optional `options` object argument may specify `servePersonalizedAds: true` value — then ad will be personalized. |
| `showAdAsync()`                 | (async) shows a rewarded if it is ready (async)                                                                                                      |

#### Events

| Events are based on native ad lifecycle |
| --------------------------------------- |
| `rewardedVideoUserDidEarnReward`        |
| `rewardedVideoDidLoad`                  |
| `rewardedVideoDidFailToLoad`            |
| `rewardedVideoDidPresent`               |
| `rewardedVideoDidFailToPresent`         |
| `rewardedVideoDidDismiss`               |

#### Test ID

```tsx
const adUnitID = Platform.select({
  // https://developers.google.com/admob/ios/test-ads
  ios: 'ca-app-pub-3940256099942544/1712485313',
  // https://developers.google.com/admob/android/test-ads
  android: 'ca-app-pub-3940256099942544/5224354917',
});
```

## Permissions

### Android

The following permissions are added automatically through this library's `AndroidManifest.xml`.

<AndroidPermissions permissions={['INTERNET']} />

### iOS

The following usage description keys are used by this library:

<IOSPermissions permissions={[ 'NSUserTrackingUsageDescription' ]} />
