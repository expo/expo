# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.2.0 — 2022-04-18

### 🐛 Bug fixes

- Fix an issue on Android that appName cannot be set with Facebook.initializeAsync(). ([#16809](https://github.com/expo/expo/pull/16809) by [@dacer](https://github.com/dacer))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2021-12-03

### 💡 Others

- Rewritten module to Kotlin. ([#14572](https://github.com/expo/expo/pull/14572) by [@mstach60161](https://github.com/mstach60161))

## 12.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 12.0.0 — 2021-09-28

### 🛠 Breaking changes

- [plugin] Removed swift noop file plugin. ([#13532](https://github.com/expo/expo/pull/13532) by [@EvanBacon](https://github.com/EvanBacon))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add `usePermissions` hook from modules factory. ([#13857](https://github.com/expo/expo/pull/13857) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- `logPurchaseAsync` on iOS now accepts an `NSNumber` type, which has no user-facing impact besides fixing an error message in the App Events console. ([#13369](https://github.com/expo/expo/pull/13369) by [@cruzach](https://github.com/cruzach))
- Update error handler for `logInWithReadPermissionsAsync` to handle empty userInfo in native exception. ([#14492](https://github.com/expo/expo/pull/14492) by [@ajsmth](https://github.com/ajsmth))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- More TypeScript doc blocks. ([#13657](https://github.com/expo/expo/pull/13657) by [@cruzach](https://github.com/cruzach))
- Export `FacebookInitializationOptions`
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Add correct return types to the `withFacebookIOS` setters. ([#14423](https://github.com/expo/expo/pull/14423) by [@Simek](https://github.com/Simek))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 11.2.0 — 2021-06-16

### 🎉 New features

- [plugin] Refactor imports ([#13029](https://github.com/expo/expo/pull/13029) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Ability to disable `NSUserTrackingUsageDescription` by passing `userTrackingPermission: false`. ([#12767](https://github.com/expo/expo/pull/12767) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Bump min target to node 12. ([#12743](https://github.com/expo/expo/pull/12743) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Removed unnecessary dependency on `unimodules-constants-interface`. ([#12876](https://github.com/expo/expo/pull/12876) by [@tsapeta](https://github.com/tsapeta))
- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 11.1.1 — 2021-04-20

_This version does not introduce any user-facing changes._

## 11.1.0 — 2021-04-19

### 🎉 New features

- Added AppEvents-related functionality. ([#12459](https://github.com/expo/expo/pull/12459) by [@cruzach](https://github.com/cruzach))

## 11.0.5 — 2021-04-13

_This version does not introduce any user-facing changes._

## 11.0.4 — 2021-03-31

_This version does not introduce any user-facing changes._

## 11.0.3 — 2021-03-30

### 🎉 New features

- Updated user tracking permission message. ([#12322](https://github.com/expo/expo/pull/12322) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.2 — 2021-03-23

### 🎉 New features

- Added noop Swift file generation to iOS plugin. ([#12251](https://github.com/expo/expo/pull/12251) by [@EvanBacon](https://github.com/EvanBacon))
- Added SKAdNetwork identifiers to iOS plugin. ([#12243](https://github.com/expo/expo/pull/12243) by [@EvanBacon](https://github.com/EvanBacon))
- Added user tracking permission to iOS plugin. ([#12219](https://github.com/expo/expo/pull/12219) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.1 — 2021-03-10

### 🐛 Bug fixes

- Added the app tracking permission. ([#12123](https://github.com/expo/expo/pull/12123) by [@lukmccall](https://github.com/lukmccall))

## 11.0.0 — 2021-03-02

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Upgraded Facebook iOS SDK to `9.0.1`. ([#11921](https://github.com/expo/expo/pull/11921) by [@dreamolight](https://github.com/dreamolight) and [@tsapeta](https://github.com/tsapeta))
- Removed `setAutoInitEnabledAsync` method — we recommend to explicitly use `initializeAsync` instead. ([#11921](https://github.com/expo/expo/pull/11921) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Exposed `setAdvertiserTrackingEnabled` function to be compliant with Apple's iOS 14 tracking policy. ([#11921](https://github.com/expo/expo/pull/11921) by [@dreamolight](https://github.com/dreamolight) and [@tsapeta](https://github.com/tsapeta))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugin. ([#11624](https://github.com/expo/expo/pull/11624) by [@EvanBacon](https://github.com/EvanBacon))

## 9.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- `expo-facebook` All methods and platforms now return times in JS `Date` objects instead of seconds. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Error code `E_CONF_ERROR` has been replaced with `ERR_FACEBOOK_MISCONFIGURED`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Some instances of the error code `E_NO_INIT` in the client have been replaced with `ERR_FACEBOOK_UNINITIALIZED`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Some instances of the error code `E_FBLOGIN_ERROR` in the client have been replaced with `ERR_FACEBOOK_LOGIN`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `initializeAsync` now accepts a single argument of type [`FacebookInitializationOptions`](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/facebook.md#login-options), previously this method accepted two arguments: `appId: string` & `appName: string`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))

### 🎉 New features

- `expo-facebook` Added method to get Facebook authentication state. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Added method to log out of Facebook `logOutAsync()`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
