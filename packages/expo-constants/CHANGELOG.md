# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 10.0.1 — 2021-01-25

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Add support for new Apple devices to `platform.ios.deviceModel`. ([#11446](https://github.com/expo/expo/pull/11446) by [@sjchmiela](https://github.com/sjchmiela))
- Changed `Constants.platform.ios.model` nullability — it can now be `null`, if the value cannot be determined. ([#11445](https://github.com/expo/expo/pull/11445) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))
- Added support for simulators running on Apple ARM64 processors (previously, constants expected to be exported by native code were unavailable). ([#11445](https://github.com/expo/expo/pull/11445) by [@sjchmiela](https://github.com/sjchmiela))

## 9.3.5 — 2020-12-11

### 🐛 Bug fixes

- Add @expo/config to dependencies

## 9.3.4 — 2020-12-09

### 🐛 Bug fixes

- Fixed an issue where `Constants.manifest` was still undefined in debug Android builds in the bare workflow

## 9.3.3 — 2020-12-02

_This version does not introduce any user-facing changes._

## 9.3.2 — 2020-12-01

### 🐛 Bug fixes

- Fixed the `getAppConfig.js` script to work with the latest version of `@expo/config`.

## 9.3.1 — 2020-11-25

### 🛠 Breaking changes

- Fixed `installationId` being backed up on Android which resulted in multiple devices having the same `installationId`. ([#11005](https://github.com/expo/expo/pull/11005) by [@sjchmiela](https://github.com/sjchmiela))
- Deprecated `.installationId` and `.deviceId` as these properties can be implemented in user space. Instead, implement the installation identifier on your own using `expo-application`'s `.androidId` on Android and a storage API like `expo-secure-store` on iOS and `localStorage` on Web. ([#10997](https://github.com/expo/expo/pull/10997) by [@sjchmiela](https://github.com/sjchmiela))

## 9.3.0 — 2020-11-17

### 🎉 New features

- Added `Constants.executionEnvironment` to distinguish between apps running in a bare, managed standalone, or App/Play Store development client environment. ([#10986](https://github.com/expo/expo/pull/10986) by [@esamelson](https://github.com/esamelson))
- Added script to embed app configuration into a bare app and export this object as `Constants.manifest`. ([#10948](https://github.com/expo/expo/pull/10948) and [#10949](https://github.com/expo/expo/pull/10949) by [@esamelson](https://github.com/esamelson))
- If `manifest` is defined on `expo-updates` then use it instead of `ExponentConstants.manifest` ([#10668](https://github.com/expo/expo/pull/10668) by [@esamelson](https://github.com/esamelson))
- Warn when developer attempts to access empty `Constants.manifest` in bare. Throw error when it is empty in managed. ([#11028](https://github.com/expo/expo/pull/11028) by [@esamelson](https://github.com/esamelson))
- Set `Contants.executionEnvironment` to `ExecutionEnvironment.Bare` on web.

## 9.2.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 9.1.1 — 2020-05-28

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `uuid`'s deprecation of deep requiring ([#8114](https://github.com/expo/expo/pull/8114) by [@actuallymentor](https://github.com/actuallymentor))
