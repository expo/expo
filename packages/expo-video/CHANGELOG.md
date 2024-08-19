# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- [Android] Fixed `resolvedLayoutDirection` building issues when using react-native 0.75.X. ([#31064](https://github.com/expo/expo/pull/31064) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

## 1.2.4 — 2024-07-30

### 🐛 Bug fixes

- [Android] Fix Audio Manager pausing player on the wrong thread and conflicts between players. ([#30453](https://github.com/expo/expo/pull/30453) by [@behenate](https://github.com/behenate))
- [Android] Fix Audio Manager pausing player on the wrong thread and conflicts between players. ([#30453](https://github.com/expo/expo/pull/30453) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Android] Refactor `VideoPlayer.kt`, organize files ([#30452](https://github.com/expo/expo/pull/30452) by [@behenate](https://github.com/behenate))

## 1.2.3 — 2024-07-11

### 🛠 Breaking changes

- [Android][iOS] Now Picture in Picture has to be enabled via the config plugin to work. ([#30068](https://github.com/expo/expo/pull/30068) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Web] Add support for events. ([#29742](https://github.com/expo/expo/pull/29742) by [@behenate](https://github.com/behenate))
- [iOS] Add ability to disable live text interaction. ([#30093](https://github.com/expo/expo/pull/30093) by [@fobos531](https://github.com/fobos531))

### 🐛 Bug fixes

- [Web] Fix `AudioContext` being created before user interaction causing playback issues. ([#29695](https://github.com/expo/expo/pull/29695) by [@behenate](https://github.com/behenate))
- [iOS] Fix a race condition causing crashes when deallocating the player. ([#30022](https://github.com/expo/expo/pull/30022) by [@behenate](https://github.com/behenate))
- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30489](https://github.com/expo/expo/pull/30489) by [@byCedric](https://github.com/byCedric))

## 1.2.2 — 2024-07-03

### 🐛 Bug fixes

- [iOS] Fix crashes on iOS 16 and lower when source HTTP headers are undefined. ([#30104](https://github.com/expo/expo/pull/30104) by [@behenate](https://github.com/behenate))

## 1.2.1 — 2024-06-27

### 🎉 New features

- [iOS] Support Apple TV. ([#29560](https://github.com/expo/expo/pull/29560) by [@douglowder](https://github.com/douglowder))

## 1.2.0 — 2024-06-20

### 🎉 New features

- Add `isLive` property on all platforms. ([#28903](https://github.com/expo/expo/pull/28903) by [@justjoostnl](https://github.com/justjoostnl))
- [iOS] Add base64 certificate support for FairPlay DRM. ([#28990](https://github.com/expo/expo/pull/28990) by [@behenate](https://github.com/behenate))
- [Android][iOS] Add support for request headers to in the video source. ([#29539](https://github.com/expo/expo/pull/29539) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [Android] Fix wrong content fit "fill" and "cover". ([#29364](https://github.com/expo/expo/pull/29364) by [@RRaideRR](https://github.com/RRaideRR))
- [iOS] Fix player status property always returning `undefined` on iOS. ([#29505](https://github.com/expo/expo/pull/29505) by [@behenate](https://github.com/behenate))
- [Android] Fix `VideoPlayer.replace` not working when the previous source caused an error. ([#29598](https://github.com/expo/expo/pull/29598) by [@lukmccall](https://github.com/lukmccall))
- [Web] Fix default behavior for `nativeControls` to match documentation. ([#29667](https://github.com/expo/expo/pull/29667) by [@nahn20](https://github.com/nahn20))
- [iOS] Fix crashes when creating new players. ([#29428](https://github.com/expo/expo/pull/29428) by [@behenate](https://github.com/behenate))
- Fix errors on setting a null video source. ([#29613](https://github.com/expo/expo/pull/29613) by [@behenate](https://github.com/behenate))

### 💡 Others

- [iOS] Make appropriate references weak in `VideoPlayerObserver`. ([#29427](https://github.com/expo/expo/pull/29427) by [@behenate](https://github.com/behenate))

## 1.1.10 — 2024-05-29

### 💡 Others

- [Android] Improve HLS compatibility. ([#28997](https://github.com/expo/expo/pull/28997) by [@behenate](https://github.com/behenate))

## 1.1.9 — 2024-05-13

### 🎉 New features

- Add `duration` property on all platforms. ([#28576](https://github.com/expo/expo/pull/28576) by [@justjoostnl](https://github.com/justjoostnl))

## 1.1.8 — 2024-05-07

_This version does not introduce any user-facing changes._

## 1.1.7 — 2024-05-06

_This version does not introduce any user-facing changes._

## 1.1.6 — 2024-05-01

### 🎉 New features

- [Android] Add support for customizing the now playing notification. ([#28390](https://github.com/expo/expo/pull/28390) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Android] Improve audio focus management. ([#28453](https://github.com/expo/expo/pull/28453) by [@behenate](https://github.com/behenate))

## 1.1.5 — 2024-04-26

### 🎉 New features

- [iOS] Add support for customizing the now playing notification. ([#28386](https://github.com/expo/expo/pull/28386) by [@behenate](https://github.com/behenate))

## 1.1.4 — 2024-04-25

_This version does not introduce any user-facing changes._

## 1.1.3 — 2024-04-24

_This version does not introduce any user-facing changes._

## 1.1.2 — 2024-04-24

_This version does not introduce any user-facing changes._

## 1.1.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 1.1.0 — 2024-04-18

### 🎉 New features

- Create a docs page. ([#27854](https://github.com/expo/expo/pull/27854) by [@behenate](https://github.com/behenate))
- Add support for events on Android and iOS. ([#27632](https://github.com/expo/expo/pull/27632) by [@behenate](https://github.com/behenate))
- Add support for `loop`, `playbackRate`, `preservesPitch` and `currentTime` properties. ([#27367](https://github.com/expo/expo/pull/27367) by [@behenate](https://github.com/behenate))
- Add background playback support. ([#27110](https://github.com/expo/expo/pull/27110) by [@behenate](https://github.com/behenate))
- Add DRM support for Android and iOS. ([#26465](https://github.com/expo/expo/pull/26465) by [@behenate](https://github.com/behenate))
- [Android] Add Picture in Picture support. ([#26368](https://github.com/expo/expo/pull/26368) by [@behenate](https://github.com/behenate))
- [Android] Add fullscreen support. ([#26159](https://github.com/expo/expo/pull/26159) by [@behenate](https://github.com/behenate))
- [web] Add volume ([#26137](https://github.com/expo/expo/pull/26137) by [@behenate](https://github.com/behenate))
- Initial release for Android 🎉 ([#26033](https://github.com/expo/expo/pull/26033) by [@behenate](https://github.com/behenate))
- [Android] Adds support for boarders. ([#27003](https://github.com/expo/expo/pull/27003) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix memory leaks on fast refresh. ([#27428](https://github.com/expo/expo/pull/27428) by [@behenate](https://github.com/behenate))

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 0.3.1 — 2023-12-12

_This version does not introduce any user-facing changes._

## 0.3.0 — 2023-12-12

### 🎉 New features

- [iOS] Add Picture in Picture support. ([#25522](https://github.com/expo/expo/pull/25522) by [@behenate](https://github.com/behenate))

## 0.2.0 — 2023-11-14

### 🛠 Breaking changes

- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 0.1.0 — 2023-10-30

### 🎉 New features

- Initial release for iOS 🎉
