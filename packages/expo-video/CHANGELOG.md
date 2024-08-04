# Changelog

## Unpublished

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840), [#30859](https://github.com/expo/expo/pull/30859) by [@tsapeta](https://github.com/tsapeta))
- Changed the return type of all player events to a single object for a better support of the `useEvent` hook. ([#32104](https://github.com/expo/expo/pull/32104) by [@behenate](https://github.com/behenate))
- Separated the `volumeChange` event into `volumeChange` and `mutedChange` events. ([#32104](https://github.com/expo/expo/pull/32104) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Android][iOS] Add support for controlling the buffering behavior. ([#30602](https://github.com/expo/expo/pull/30602) by [@behenate](https://github.com/behenate))
- [iOS] Add 'allowsExternalPlayback' property to control the AirPlay to stream video or mirror the screen. ([#30436](https://github.com/expo/expo/pull/30436) by [@adsalihac](https://github.com/adsalihac))
- [iOS] Fixed `player.currentTime` being `NaN` when source is not provided and `player.duration` being `NaN` inside the hook callback when the source is updated. ([#31011](https://github.com/expo/expo/pull/31011) by [@AlirezaHadjar](https://github.com/AlirezaHadjar))
- [Android] Fix not being able to select subtitles in the player. ([#31829](https://github.com/expo/expo/pull/31829) by [@fobos531](https://github.com/fobos531))
- Added generating video thumbnails. ([#31807](https://github.com/expo/expo/pull/31807) by [@tsapeta](https://github.com/tsapeta) & [#32037](https://github.com/expo/expo/pull/32037) by [@lukmccall](https://github.com/lukmccall))
- Add support for artwork in the now playing info. ([#30809](https://github.com/expo/expo/pull/30809) by [@AlirezaHadjar](https://github.com/AlirezaHadjar))

### 🐛 Bug fixes

- [Android] Fix `FullscreenPlayerActivity` not closing when the system returned to the `MainActivity` after backgrounding and reopening the app via icon. ([#32044](https://github.com/expo/expo/pull/32044) by [@behenate](https://github.com/behenate))
- [Android] Fix `Activity` auto-entering Picture in Picture after leaving the screen with video. ([#32043](https://github.com/expo/expo/pull/32043) by [@behenate](https://github.com/behenate))
- [Android] Fix `startsPictureInPictureAutomatically` not working in fullscreen mode. ([#32043](https://github.com/expo/expo/pull/32043) by [@behenate](https://github.com/behenate))
- [Android] Fix video pausing after auto-entering Picture in Picture. ([#32043](https://github.com/expo/expo/pull/32043) by [@behenate](https://github.com/behenate))
- [Android] Fix `MainActivity` sometimes entering Picture in Picture when entering fullscreen. ([#32043](https://github.com/expo/expo/pull/32043) by [@behenate](https://github.com/behenate))
- [Android] Fix support for local file playback. ([#30472](https://github.com/expo/expo/pull/30472) by [@behenate](https://github.com/behenate))
- Only import from `expo/config-plugins` to follow proper dependency chains. ([#30499](https://github.com/expo/expo/pull/30499) by [@byCedric](https://github.com/byCedric))
- [Android] Fix an issue where using non-ASCII characters in the application name would cause the media to not play. ([#31659](https://github.com/expo/expo/pull/31659) by [@fobos531](https://github.com/fobos531))
- [Android] Fix an issue where the entire app would go into picture-in-picture after unmounting the video if the `startsPictureInPictureAutomatically` prop was enabled. ([#31901](https://github.com/expo/expo/pull/31901) by [@fobos531](https://github.com/fobos531))

### 💡 Others

- [Android] Add @UnstableReactNativeAPI annotation to classes ([#31549](https://github.com/expo/expo/pull/31549) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### ⚠️ Notices

- Added support for React Native 0.75.x. ([#30034](https://github.com/expo/expo/pull/30034) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 1.2.7 - 2024-09-26

### 🐛 Bug fixes

- [Web] Fix invalid `resolveAssetSource` for web. ([#31664](https://github.com/expo/expo/pull/31664) by [@behenate](https://github.com/behenate))

## 1.2.6 - 2024-09-13

### 🛠 Breaking changes

- `showNowPlayingNotification` property of the player now defaults to `false`. ([#31261](https://github.com/expo/expo/pull/31261) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Android][iOS] Add properties for more advanced live stream configuration. ([#30648](https://github.com/expo/expo/pull/30648) by [@justjoostnl](https://github.com/justjoostnl))
- [iOS] Add live indicator in the now playing info. ([#30629](https://github.com/expo/expo/pull/30629) by [@justjoostnl](https://github.com/justjoostnl))
- Add fullscreen enter and exit events. ([#30922](https://github.com/expo/expo/pull/30922) by [@fobos531](https://github.com/fobos531))
- Add support for playback of local assets imported with the `require` function. ([#30837](https://github.com/expo/expo/pull/30837) by [@behenate](https://github.com/behenate))
- [Web] Add support for Picture in Picture. ([#30524](https://github.com/expo/expo/pull/30524) by [@behenate](https://github.com/behenate))
- Add `timeUpdate` event configured with `timeUpdateEventInterval` property.([#31327](https://github.com/expo/expo/pull/31327) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [Android] Fix wrong event being sent when the volume is changed. ([#30891](https://github.com/expo/expo/pull/30891) by [@behenate](https://github.com/behenate))

### 💡 Others

- Bump media3 version to 1.4.0. ([#31239](https://github.com/expo/expo/pull/31239) by [@behenate](https://github.com/behenate))
- [Android] The media will now be buffered even when the player is unmounted to match iOS behavior. ([#30626](https://github.com/expo/expo/pull/30626) by [@behenate](https://github.com/behenate))

## 1.2.4 - 2024-07-30

### 🐛 Bug fixes

- [Android] Fix Audio Manager pausing player on the wrong thread and conflicts between players. ([#30453](https://github.com/expo/expo/pull/30453) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Android] Refactor `VideoPlayer.kt`, organize files ([#30452](https://github.com/expo/expo/pull/30452) by [@behenate](https://github.com/behenate))

## 1.2.3 - 2024-07-11

### 🛠 Breaking changes

- [Android][iOS] Now Picture in Picture has to be enabled via the config plugin to work. ([#30068](https://github.com/expo/expo/pull/30068) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Web] Add support for events. ([#29742](https://github.com/expo/expo/pull/29742) by [@behenate](https://github.com/behenate))
- [iOS] Add ability to disable live text interaction. ([#30093](https://github.com/expo/expo/pull/30093) by [@fobos531](https://github.com/fobos531))

### 🐛 Bug fixes

- [Web] Fix `AudioContext` being created before user interaction causing playback issues. ([#29695](https://github.com/expo/expo/pull/29695) by [@behenate](https://github.com/behenate))
- [iOS] Fix a race condition causing crashes when deallocating the player. ([#30022](https://github.com/expo/expo/pull/30022) by [@behenate](https://github.com/behenate))
- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30489](https://github.com/expo/expo/pull/30489) by [@byCedric](https://github.com/byCedric))

## 1.2.2 - 2024-07-03

### 🐛 Bug fixes

- [iOS] Fix crashes on iOS 16 and lower when source HTTP headers are undefined. ([#30104](https://github.com/expo/expo/pull/30104) by [@behenate](https://github.com/behenate))

## 1.2.1 - 2024-06-27

### 🎉 New features

- [iOS] Support Apple TV. ([#29560](https://github.com/expo/expo/pull/29560) by [@douglowder](https://github.com/douglowder))

## 1.2.0 - 2024-06-20

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

## 1.1.10 - 2024-05-29

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
