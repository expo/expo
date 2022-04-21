# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.0.0 — 2022-04-18

### 🛠 Breaking changes

- Removed `AdMobBanner#onAdViewWillLeaveApplication`, `AdMobInterstitial#interstitialWillLeaveApplication` and `PublisherBanner#onAdViewWillLeaveApplication` callbacks as they are no longer exposed by the native libraries. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fix a crash on startup by setting `GADIsAdManagerApp` in `Info.plist` to `true`. ([#16438](https://github.com/expo/expo/pull/16438) by [@giautm](https://github.com/giautm))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On iOS bumped `Google-Mobile-Ads-SDK@7.69.0 ➡️ 8.13.0`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bumped `com.google.android.gms:play-services-ads:19.4.0 ➡️ 20.5.0`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.0.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.0.0 — 2021-12-03

### 🛠 Breaking changes

- Remove deprecated `setTestDeviceID` method. ([#15091](https://github.com/expo/expo/pull/15091) by [@Simek](https://github.com/Simek))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add permissions hook from modules factory. ([#13849](https://github.com/expo/expo/pull/13849) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 10.1.0 — 2021-06-16

### 🎉 New features

- [plugin] Refactor imports ([#13029](https://github.com/expo/expo/pull/13029) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Updated `BannerView` on Android to not create a new ad request on every layout change. ([#12599](https://github.com/expo/expo/pull/12599) by [@cruzach](https://github.com/cruzach))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

## 10.0.4 — 2021-04-13

_This version does not introduce any user-facing changes._

## 10.0.3 — 2021-03-31

_This version does not introduce any user-facing changes._

## 10.0.2 — 2021-03-30

### 🎉 New features

- Updated user tracking permission message. ([#12322](https://github.com/expo/expo/pull/12322) by [@EvanBacon](https://github.com/EvanBacon))

## 10.0.1 — 2021-03-23

### 🎉 New features

- Added SKAdNetwork identifiers to iOS plugin. ([#12243](https://github.com/expo/expo/pull/12243) by [@EvanBacon](https://github.com/EvanBacon))
- Added user tracking permission to iOS plugin. ([#12219](https://github.com/expo/expo/pull/12219) by [@EvanBacon](https://github.com/EvanBacon))

## 10.0.0 — 2021-03-10

### 📚 native library updates

- Updated `Google-Mobile-Ads-SDK` from `7.55.1` to `7.69.0` on iOS and `com.google.android.gms:play-services-ads` from `17.2.1` to `19.4.0` on Android. ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))

### 🛠 Breaking changes

- Removed the `rewardedVideoWillLeaveApplication` event (use AppState instead). ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))
- Removed following events: `rewardedVideoDidRewardUser`, `rewardedVideoDidOpen`, `rewardedVideoDidComplete`, `rewardedVideoDidClose`, `rewardedVideoDidStart` and introduced: `rewardedVideoUserDidEarnReward`, `rewardedVideoDidPresent`, `rewardedVideoDidFailToPresent`, `rewardedVideoDidDismiss`. ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))
- Added the app tracking permission. ([#12123](https://github.com/expo/expo/pull/12123) by [@lukmccall](https://github.com/lukmccall))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugin. ([#11636](https://github.com/expo/expo/pull/11636) by [@EvanBacon](https://github.com/EvanBacon))

## 8.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-18

### 🎉 New features

- Added `isAvailableAsync`. ([#9690](https://github.com/expo/expo/pull/9690) by [@EvanBacon](https://github.com/EvanBacon))
- Delete `prop-types` in favor of TypeScript. ([#8677](https://github.com/expo/expo/pull/8677) by [@EvanBacon](https://github.com/EvanBacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
