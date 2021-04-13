# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
- `initializeAsync` now accepts a single argument of type [`FacebookInitializationOptions`](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/facebook.md#login-options), previously this method accepted two arguments: `appId: string` & `appName: string`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))

### 🎉 New features

- `expo-facebook` Added method to get Facebook authentication state. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Added method to log out of Facebook `logOutAsync()`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
