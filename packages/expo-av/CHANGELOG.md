# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fix audio recording after reload. ([#9283](https://github.com/expo/expo/pull/9283) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix fullscreen events not emitted on iOS. ([#9323](https://github.com/expo/expo/pull/9323) by [@IjzerenHein](https://github.com/IjzerenHein))
- Prevent debugger break when removing observations. ([#9334](https://github.com/expo/expo/pull/9334) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix iOS stability issue due to player-item observers not cleaned up. ([#9350](https://github.com/expo/expo/pull/9350) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix duplicate full-screen will-dismiss event on iOS. ([#9366](https://github.com/expo/expo/pull/9366) by [@IjzerenHein](https://github.com/IjzerenHein))
- De-activate audio-session after unloading sound. ([#9365](https://github.com/expo/expo/pull/9365) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix resume audio when in background. ([#9363](https://github.com/expo/expo/pull/9363) by [@IjzerenHein](https://github.com/IjzerenHein))

## 8.3.0 — 2020-07-08

### 🎉 New features

- [av] Delete `prop-types` in favor of TypeScript. ([#8679](https://github.com/expo/expo/pull/8679) by [@EvanBacon](https://github.com/EvanBacon))
- [av] Directly import `createElement` from `react-native-web` for RNW v12 support. ([#8773](https://github.com/expo/expo/pull/8773) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Allow playing media files embedded as resources in an Android APK. ([#8936](https://github.com/expo/expo/pull/8936) by [@esamelson](https://github.com/esamelson))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fix unable to call presentFullScreenPlayer twice. ([#8343](https://github.com/expo/expo/pull/8343) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fixed multiplied callbacks in `expo-av` after replaying ([#7193](https://github.com/expo/expo/pull/7193) by [@mczernek](https://github.com/mczernek))
- Fixed `Plaback.loadAsync()` return type. ([#7559](https://github.com/expo/expo/pull/7559) by [@awinograd](https://github.com/awinograd))
- Fixed the adaptive streaming for exoplayer on android. ([#8380](https://github.com/expo/expo/pull/8363) by [@watchinharrison](https://github.com/watchinharrison))
