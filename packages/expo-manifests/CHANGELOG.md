# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.4.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Replace `getAndroidJsEngine` as `jsEngine` lazy kotlin property. ([#19116](https://github.com/expo/expo/pull/19116) by [@kudo](https://github.com/kudo))

## 0.3.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 0.3.0 — 2022-04-18

### 🎉 New features

- Add `logUrl` getter to both platforms. ([#16709](https://github.com/expo/expo/pull/16709) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Add support for expo project information certificate extension. ([#16607](https://github.com/expo/expo/pull/16607) by [@wschurman](https://github.com/wschurman))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.2.4 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.2.3 - 2022-01-18

_This version does not introduce any user-facing changes._

## 0.2.2 — 2021-10-15

_This version does not introduce any user-facing changes._

## 0.2.1 — 2021-10-06

### 🐛 Bug fixes

- Support platform shared jsEngine schema. ([#14654](https://github.com/expo/expo/pull/14654) by [@kudo](https://github.com/kudo))

## 0.2.0 — 2021-09-28

### 🎉 New features

- Added `version` getter to both platforms, and `hostUri` getter to Android, for compatibility with expo-dev-client. ([#14460](https://github.com/expo/expo/pull/14460) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 0.1.1 — 2021-09-16

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

## 0.1.0 — 2021-09-09

Initial version.
