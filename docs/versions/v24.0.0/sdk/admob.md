---
title: AdMob
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
  didFailToReceiveAdWithError={this.bannerError} />

// Display a DFP Publisher banner
<PublisherBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-3940256099942544/6300978111" // Test ID, Replace with your-admob-unit-id
  testDeviceID="EMULATOR"
  didFailToReceiveAdWithError={this.bannerError}
  admobDispatchAppEvent={this.adMobEvent} />

// Display an interstitial
AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712'); // Test ID, Replace with your-admob-unit-id
AdMobInterstitial.setTestDeviceID('EMULATOR');
AdMobInterstitial.requestAd(() => AdMobInterstitial.showAd())

// Display a rewarded ad
AdMobRewarded.setAdUnitID('ca-app-pub-3940256099942544/5224354917'); // Test ID, Replace with your-admob-unit-id
AdMobRewarded.setTestDeviceID('EMULATOR');
AdMobRewarded.requestAd(() => AdMobRewarded.showAd());
```

## Components

### AdMobBanner

#### bannerSize property
*Corresponding to [iOS framework banner size constants](https://developers.google.com/admob/ios/banner)*

| Prop value              | Description                                 | Size                  |
|-------------------------|---------------------------------------------|-----------------------|
|`banner`                 |Standard Banner for Phones and Tablets       |320x50                 |
|`largeBanner`            |Large Banner for Phones and Tablets          |320x100                |
|`mediumRectangle`        |IAB Medium Rectangle for Phones and Tablets  |300x250                |
|`fullBanner`             |IAB Full-Size Banner for Tablet              |468x60                 |
|`leaderboard`            |IAB Leaderboard for Tablets                  |728x90                 |
|**`smartBannerPortrait`**|Smart Banner for Phones and Tablets (default)|Screen width x 32|50|90|
|`smartBannerLandscape`   |Smart Banner for Phones and Tablets          |Screen width x 32|50|90|

*Note: There is no `smartBannerPortrait` and `smartBannerLandscape` on Android. Both prop values will map to `smartBanner`*


#### Events as function props
*Corresponding to [Ad lifecycle event callbacks](https://developers.google.com/admob/ios/banner)*

| Prop                                           |
|------------------------------------------------|
|`adViewDidReceiveAd()`                          |
|`didFailToReceiveAdWithError(errorDescription)` |
|`adViewWillPresentScreen()`                     |
|`adViewWillDismissScreen()`                     |
|`adViewDidDismissScreen()`                      |
|`adViewWillLeaveApplication()`                  |

### AdMobInterstitials

#### Methods

| Name                      | Description                                                                                                     |
|---------------------------|-----------------------------------------------------------------------------------------------------------------|
|`setAdUnitID(adUnitID)`    | sets the AdUnit ID for all future ad requests.                                                                  |
|`setTestDeviceID(deviceID)`| sets the test device ID                                                                                         |
|`requestAd(callback)`      | requests an interstitial and calls callback when `interstitialDidLoad` or`interstitialDidFailToLoad` event fires|
|`showAd(callback)`         | shows an interstitial if it is ready and calls callback when `interstitialDidOpen` event fires                  |
|`isReady(callback)`        | calls callback with boolean whether interstitial is ready to be shown                                           |

*For simulators/emulators you can use `'EMULATOR'` for the test device ID.*

#### Events
Unfortunately, events are not consistent across iOS and Android. To have one unified API, new event names are introduced for pairs that are roughly equivalent.

| iOS                                      | *this library*                   | Android             |
|------------------------------------------|----------------------------------|---------------------|
|`interstitialDidReceiveAd`                |`interstitialDidLoad`             |`onAdLoaded`         |
|`interstitial:didFailToReceiveAdWithError`|`interstitialDidFailToLoad`       |`onAdFailedToLoad`   |
|`interstitialWillPresentScreen`           |`interstitialDidOpen`             |`onAdOpened`         |
|`interstitialDidFailToPresentScreen`      |                                  |                     |
|`interstitialWillDismissScreen`           |                                  |                     |
|`interstitialDidDismissScreen`            |`interstitialDidClose`            |`onAdClosed`         |
|`interstitialWillLeaveApplication`        |`interstitialWillLeaveApplication`|`onAdLeftApplication`|

*Note that `interstitialWillLeaveApplication` and `onAdLeftApplication` are not exactly the same but share one event in this library.*


### AdMobRewarded

Opens a rewarded AdMob ad.

#### Methods
| Name                      | Description                                                                                                     |
|---------------------------|-----------------------------------------------------------------------------------------------------------------|
|`setAdUnitID(adUnitID)`    | sets the AdUnit ID for all future ad requests.                                                                  |
|`setTestDeviceID(deviceID)`| sets the test device ID                                                                                         |
|`requestAd(callback)`      | requests a rewarded ad|
|`showAd(callback)`         | shows a rewarded if it is ready                  |

#### Events

| iOS                                        | *this library*                    | Android                          |
|--------------------------------------------|-----------------------------------|----------------------------------|
|`rewardBasedVideoAd:didRewardUserWithReward`|`rewardedVideoDidRewardUser`       |`onRewarded`                      |
|`rewardBasedVideoAdDidReceiveAd`            |`rewardedVideoDidLoad`             |`onRewardedVideoAdLoaded`         |
|`rewardBasedVideoAd:didFailToLoadWithError` |`rewardedVideoDidFailToLoad`       |`onRewardedVideoAdFailedToLoad`   |
|`rewardBasedVideoAdDidOpen`                 |`rewardedVideoDidOpen`             |`onRewardedVideoAdOpened`         |
|`rewardBasedVideoAdDidClose`                |`rewardedVideoDidClose`            |`onRewardedVideoAdClosed`         |
|`rewardBasedVideoAdWillLeaveApplication`    |`rewardedVideoWillLeaveApplication`|`onRewardedVideoAdLeftApplication`|
