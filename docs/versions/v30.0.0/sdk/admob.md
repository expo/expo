---
title: Admob
---

Expo includes support for the [Google AdMob SDK](https://www.google.com/admob/) for mobile advertising. This module is largely based of the [react-native-admob](https://github.com/sbugert/react-native-admob) module, as the documentation and questions surrounding that module may prove helpful. A simple example implementing AdMob SDK can be found [here](https://github.com/deadcoder0904/expo-google-admob).

## Usage

```javascript
import {
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded
} from 'expo';

// Display a banner
<AdMobBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-3940256099942544/6300978111" // Test ID, Replace with your-admob-unit-id
  testDeviceID="EMULATOR"
  onDidFailToReceiveAdWithError={this.bannerError} />

// Display a DFP Publisher banner
<PublisherBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-3940256099942544/6300978111" // Test ID, Replace with your-admob-unit-id
  testDeviceID="EMULATOR"
  onDidFailToReceiveAdWithError={this.bannerError}
  onAdMobDispatchAppEvent={this.adMobEvent} />

// Display an interstitial
AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712'); // Test ID, Replace with your-admob-unit-id
AdMobInterstitial.setTestDeviceID('EMULATOR');
await AdMobInterstitial.requestAdAsync();
await AdMobInterstitial.showAdAsync();

// Display a rewarded ad
AdMobRewarded.setAdUnitID('ca-app-pub-3940256099942544/1033173712'); // Test ID, Replace with your-admob-unit-id
AdMobRewarded.setTestDeviceID('EMULATOR');
await AdMobRewarded.requestAdAsync();
await AdMobRewarded.showAdAsync();
```

## Components

### AdMobBanner

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
| `onAdViewWillLeaveApplication()`                          |

### AdMobInterstitials

#### Methods

| Name                        | Description                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `setAdUnitID(adUnitID)`     | sets the AdUnit ID for all future ad requests.                                                              |
| `setTestDeviceID(deviceID)` | sets the test device ID                                                                                     |
| `requestAdAsync()`          | requests an interstitial and resolves when `interstitialDidLoad` or `interstitialDidFailToLoad` event fires |
| `showAdAsync()`             | shows an interstitial if it is ready and resolves when `interstitialDidOpen` event fires                    |
| `getIsReadyAsync()`         | resolves with boolean whether interstitial is ready to be shown                                             |

_For simulators/emulators you can use `'EMULATOR'` for the test device ID._

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
| `interstitialWillLeaveApplication`         | `interstitialWillLeaveApplication` | `onAdLeftApplication` |

_Note that `interstitialWillLeaveApplication` and `onAdLeftApplication` are not exactly the same but share one event in this library._

### AdMobRewarded

Opens a rewarded AdMob ad.

#### Methods

| Name                                    | Description                                     |
| --------------------------------------- | ----------------------------------------------- |
| `setAdUnitID(adUnitID: string)`         | sets the AdUnit ID for all future ad requests.  |
| `setTestDeviceID(testDeviceID: string)` | sets the test device ID                         |
| `requestAdAsync()`                      | (async) requests a rewarded ad                  |
| `showAdAsync()`                         | (async) shows a rewarded if it is ready (async) |

#### Events

| iOS                                          | _this library_                      | Android                            |
| -------------------------------------------- | ----------------------------------- | ---------------------------------- |
| `rewardBasedVideoAd:didRewardUserWithReward` | `rewardedVideoDidRewardUser`        | `onRewarded`                       |
| `rewardBasedVideoAdDidReceiveAd`             | `rewardedVideoDidLoad`              | `onRewardedVideoAdLoaded`          |
| `rewardBasedVideoAd:didFailToLoadWithError`  | `rewardedVideoDidFailToLoad`        | `onRewardedVideoAdFailedToLoad`    |
| `rewardBasedVideoAdDidOpen`                  | `rewardedVideoDidOpen`              | `onRewardedVideoAdOpened`          |
|                                              | `rewardedVideoDidComplete`          | `onRewardedVideoCompleted`         |
| `rewardBasedVideoAdDidClose`                 | `rewardedVideoDidClose`             | `onRewardedVideoAdClosed`          |
| `rewardBasedVideoAdWillLeaveApplication`     | `rewardedVideoWillLeaveApplication` | `onRewardedVideoAdLeftApplication` |
