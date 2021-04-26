# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 3.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 3.1.1 — 2021-04-09

_This version does not introduce any user-facing changes._

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.4.1 — 2020-11-25

### 🐛 Bug fixes

- Fixed return type of `getIosIdForVendorAsync` to include possible `null` value which can be returned if the device hasn't been unlocked yet (for more information consult the [Apple documentation for `identifierForVendor`](https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor?language=objc)). ([#10997](https://github.com/expo/expo/pull/10997) by [@sjchmiela](https://github.com/sjchmiela))

## 2.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 2.2.1 — 2020-05-28

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
