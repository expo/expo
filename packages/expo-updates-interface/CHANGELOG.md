# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.7.0 — 2022-07-07

### 💡 Others

- [Android] Get downloaded update IDs. ([#17933](https://github.com/expo/expo/pull/17933) by [@douglowder](https://github.com/douglowder))

## 0.6.0 — 2022-04-18

### 🎉 New features

- Add controller registry in order to support dev client auto-setup with updates integration on iOS. ([#16230](https://github.com/expo/expo/pull/16230) by [@esamelson](https://github.com/esamelson))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 0.5.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.5.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 0.4.0 — 2021-09-28

### 🐛 Bug fixes

- Removed unnecessary gradle dependency on expo-modules-core. ([#14464](https://github.com/expo/expo/pull/14464) by [@esamelson](https://github.com/esamelson))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 0.3.1 — 2021-09-16

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

## 0.3.0 — 2021-09-09

_This version does not introduce any user-facing changes._

## 0.2.2 — 2021-07-05

### 🐛 Bug fixes

- Remove unnecessary gradle dependency on unimodules-core. ([#13481](https://github.com/expo/expo/pull/13481) by [@esamelson](https://github.com/esamelson))

## 0.2.1 — 2021-06-24

### 🛠 Breaking changes

- Added method to reset Updates module state. ([#13346](https://github.com/expo/expo/pull/13346) by [@esamelson](https://github.com/esamelson))

## 0.1.0 — 2021-06-10

### 🛠 Breaking changes

- Renamed the iOS protocol to EXUpdatesExternalInterface. ([#13214](https://github.com/expo/expo/pull/13214) by [@esamelson](https://github.com/esamelson))

## 0.0.2 — 2021-06-08

### 🎉 New features

- - Added initial iOS protocol. ([#13088](https://github.com/expo/expo/pull/13088) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Make Update nullable in onSuccess callback ([#13136](https://github.com/expo/expo/pull/13136) by [@esamelson](https://github.com/esamelson))

## 0.0.1 — 2021-05-28

### 🎉 New features

- Added package and initial Android interface. ([#13030](https://github.com/expo/expo/pull/13030) by [@esamelson](https://github.com/esamelson))
