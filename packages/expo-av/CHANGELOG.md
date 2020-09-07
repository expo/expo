# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 8.6.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.5.0 — 2020-08-11

### 🐛 Bug fixes

- Fix progress events when no playback is active on Android. ([#9545](https://github.com/expo/expo/pull/9545) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix Video resizeMode not updated on Android. ([#9567](https://github.com/expo/expo/pull/9567) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix Video source always reloaded when changing props on Android. ([#9569](https://github.com/expo/expo/pull/9569) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix blank Video after unlocking screen. ([#9586](https://github.com/expo/expo/pull/9586) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix exception on Android when loading invalid Video source. ([#9596](https://github.com/expo/expo/pull/9596) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix Audio prepareToRecordAsync after it failed once on iOS. ([#9612](https://github.com/expo/expo/pull/9612) by [@IjzerenHein](https://github.com/IjzerenHein))
- Improve error-messages on iOS. ([#9618](https://github.com/expo/expo/pull/9618) by [@IjzerenHein](https://github.com/IjzerenHein))

## 8.4.1 — 2020-07-29

### 🐛 Bug fixes

- Removed unused and potentionally unsafe call on iOS. ([#9436](https://github.com/expo/expo/pull/9436) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix onReadyForDisplay not emitted for HLS streams/m3u8 files on iOS. ([#9443](https://github.com/expo/expo/pull/9443) by [@IjzerenHein](https://github.com/IjzerenHein))

## 8.4.0 — 2020-07-24

### 🐛 Bug fixes

- Fix stability issues when changing source and/or useNativeControls on iOS. ([#9381](https://github.com/expo/expo/pull/9381) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix stability issue due to player-item observers not cleaned up on iOS. ([#9350](https://github.com/expo/expo/pull/9350) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix audio recording not working after reload app in iOS. ([#9283](https://github.com/expo/expo/pull/9283) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix native fullscreen events not emitted on iOS. ([#9323](https://github.com/expo/expo/pull/9323) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix duplicate full-screen will-dismiss event on iOS. ([#9366](https://github.com/expo/expo/pull/9366) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix mem-leak when unmounting Video component on iOS. ([#9379](https://github.com/expo/expo/pull/9379) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix audio not resumable when app is in background on iOS (react-native-music-control usage). ([#9363](https://github.com/expo/expo/pull/9363) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix posterStyle warning. ([#9384](https://github.com/expo/expo/pull/9384) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix audio-session not de-activated after unloading sound on iOS. ([#9365](https://github.com/expo/expo/pull/9365) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix debugger break in XCode when removing observations. ([#9334](https://github.com/expo/expo/pull/9334) by [@IjzerenHein](https://github.com/IjzerenHein))

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
