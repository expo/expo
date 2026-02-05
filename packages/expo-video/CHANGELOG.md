# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- [Android] Fix crash due to `SimpleCache` directory lock conflicts. ([#42723](https://github.com/expo/expo/pull/42723) by [@santitopo](https://github.com/santitopo))

### 💡 Others

## 55.0.4 — 2026-02-03

### 🐛 Bug fixes

- [Android] Fix uninitialized `firstFrameEventGenerator` exception in VideoView when setting the `player` prop. ([#42615](https://github.com/expo/expo/pull/42615) by [@behenate](https://github.com/behenate))

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🛠 Breaking changes

- Remove the `allowsFullscreen` prop. ([#41606](https://github.com/expo/expo/pull/41606) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [Android][iOS] Add `seek tolerance` and `scrubbingModeOptions` properties to the player. ([#40203](https://github.com/expo/expo/pull/40203) by [@behenate](https://github.com/behenate))
- Allow assigning `null` value to the `player` prop of the `VideoView` ([#40860](https://github.com/expo/expo/pull/40860) by [@behenate](https://github.com/behenate))
- [Android][iOS] Add `averageBitrate` and `peakBitrate` for video tracks. ([#41532](https://github.com/expo/expo/pull/41532) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [Android] Emit `onFirstFrameRender` when player is moved to a new `VideoView` and renders a frame. ([#40854](https://github.com/expo/expo/pull/40854) by [@behenate](https://github.com/behenate))
- [Android] Fix media controls (e.g. bluetooth) not working when `ExpoVideoPlaybackService` is not registered. ([#40728](https://github.com/expo/expo/pull/40728) by [@behenate](https://github.com/behenate))
- [Web] Fix crash on older versions of Safari. ([#41101](https://github.com/expo/expo/pull/41101) by [@CamWass](https://github.com/CamWass))
- [Web] Fix video pausing when entering fullscreen in electron apps. ([#40989](https://github.com/expo/expo/pull/40989) by [@behenate](https://github.com/behenate))
- [Android] Fix crashes when exiting PiP with one than more `VideoView` present on the screen. ([#41090](https://github.com/expo/expo/pull/41090) by [@behenate](https://github.com/behenate))
- [Android] Fix rare crashes related to VideoPlayer listeners. ([#41608](https://github.com/expo/expo/pull/41608) by [@behenate](https://github.com/behenate))
- Fix `fullscreenOptions.enable` and `allowsFullscreen` props issues. ([#41600](https://github.com/expo/expo/pull/41600) by [@behenate](https://github.com/behenate))
- [Android] Fix player duration property refreshing too late. ([#41609](https://github.com/expo/expo/pull/41609) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Android] Remove @UnstableReactNativeAPI annotations. ([#39921](https://github.com/expo/expo/pull/39921) by [@jakex7](https://github.com/jakex7))
- [iOS] Load track information for events in asynchronous context. ([#40355](https://github.com/expo/expo/pull/40355) by [@behenate](https://github.com/behenate))
- Add extract the object `VideoSource` type into separate `VideoSourceObject` type. ([#41514](https://github.com/expo/expo/pull/41514) by [@behenate](https://github.com/behenate))
- [Android] Set property values on calling thread. ([#41533](https://github.com/expo/expo/pull/41533) by [@behenate](https://github.com/behenate))
- Mark the video track `bitrate` field as deprecated. ([#41532](https://github.com/expo/expo/pull/41532) by [@behenate](https://github.com/behenate))

## 3.0.15 - 2025-12-05

_This version does not introduce any user-facing changes._

## 3.0.14 - 2025-11-05

_This version does not introduce any user-facing changes._

## 3.0.13 - 2025-11-03

_This version does not introduce any user-facing changes._

## 3.0.12 - 2025-10-28

### 🐛 Bug fixes

- Fix `FOREGROUND_SERVICE_MEDIA_PLAYBACK` being always present in the manifest. ([#40074](https://github.com/expo/expo/pull/40074) by [@behenate](https://github.com/behenate))
- [iOS] Fix crashes when rapidly replacing HLS sources. ([#40265](https://github.com/expo/expo/pull/40265) by [@behenate](https://github.com/behenate))
- [Android] Fix the `player` prop of the `VideoView` not working when a player is re-assigned after being replaced by a different player earlier. ([#40709](https://github.com/expo/expo/pull/40709) by [@behenate](https://github.com/behenate))
- [Android] Fix surface view not showing when changing the `player` prop. ([#40817](https://github.com/expo/expo/pull/40817) by [@behenate](https://github.com/behenate))

## 3.0.11 — 2025-09-10

### 🎉 New features

- [iOS] Add support for playing PHAsset uris. ([#39371](https://github.com/expo/expo/pull/39371) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Web] Allow access to the underlying HTMLVideoElement via the `nativeRef` property. ([#39448](https://github.com/expo/expo/pull/39448) by [@behenate](https://github.com/behenate))

## 3.0.10 — 2025-09-04

### 🐛 Bug fixes

- [Web] Fix fullscreen enter/exit methods and listeners not working in Safari on iOS. ([#39320](https://github.com/expo/expo/pull/39320) by [@behenate](https://github.com/behenate))

## 3.0.9 — 2025-09-03

### 🛠 Breaking changes

- [Android] In order to show the now playing notification, the `supportsBackgroundPlayground` property of the config plugin has to be `true`. ([#38980](https://github.com/expo/expo/pull/38980) by [@kerwanp](https://github.com/kerwanp))

### 🐛 Bug fixes

- [Android] Fix video player stopping playback a few minutes after locking the device. ([#38980](https://github.com/expo/expo/pull/38980) by [@kerwanp](https://github.com/kerwanp))

## 3.0.8 — 2025-09-02

_This version does not introduce any user-facing changes._

## 3.0.7 — 2025-08-28

_This version does not introduce any user-facing changes._

## 3.0.6 — 2025-08-27

### 💡 Others

- [Android] Bump media3 version to 1.8.0. ([#39184](https://github.com/expo/expo/pull/39184) by [@behenate](https://github.com/behenate))

## 3.0.5 — 2025-08-25

### 🛠 Breaking changes

- [Android] Always keep the native controls always enabled in fullscreen mode to mimic iOS. ([#39015](https://github.com/expo/expo/pull/39015) by [@behenate](https://github.com/behenate))

## 3.0.4 — 2025-08-21

### 🎉 New features

- [Web] Add `useAudioNodePlayback` prop. ([#39039](https://github.com/expo/expo/pull/39039) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [iOS] Fix `sourceLoad` event not being emitted. ([#39023](https://github.com/expo/expo/pull/39023) by [@behenate](https://github.com/behenate))
- [Web] Fix audio not playing due to conflicting CORS and AudioNode settings. ([#39039](https://github.com/expo/expo/pull/39039) by [@behenate](https://github.com/behenate))
- [iOS] Background mode playback fix. ([#33706](https://github.com/expo/expo/pull/33706) by [@hromovp](https://github.com/hromovp))

## 3.0.3 — 2025-08-21

### 🎉 New features

- [Android][iOS] Add `keepScreenOnWhilePlaying` property to the player. ([#37137](https://github.com/expo/expo/pull/37137) by [@behenate](https://github.com/behenate))

### 💡 Others

- [Android] Keep the screen on while playback is running by default. ([#37137](https://github.com/expo/expo/pull/37137) by [@behenate](https://github.com/behenate))

## 3.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 3.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 3.0.0 — 2025-08-13

### 🛠 Breaking changes

- [web] Update default crossOrigin value to "anonymous" to prevent common CORS issues ([#38341](https://github.com/expo/expo/pull/38341) by [@hirbod](https://github.com/hirbod))

### 🎉 New features

- [iOS] Add complete support for AirPlay streaming. Add a device selection button and `VideoPlayer.isExternalPlaybackActive` property and appropriate listeners. ([#37207](https://github.com/expo/expo/pull/37207) by [@behenate](https://github.com/behenate))
- Add fullscreen orientation and auto-exit functionality. ([#36910](https://github.com/expo/expo/pull/36910) by [@behenate](https://github.com/behenate))
- [Android] React to system wide subtitle changes in real time, does not require an app reload ([#38591](https://github.com/expo/expo/pull/38591) by [@hirbod](https://github.com/hirbod))

### 🐛 Bug fixes

- [Android] Fix duration property resetting to 0 on video repeat. ([#37984](https://github.com/expo/expo/pull/37984) by [@Wenszel](https://github.com/Wenszel))
- [Android] Fix accessing player.loop causes app to crash. ([#37928](https://github.com/expo/expo/pull/37928) by [@Wenszel](https://github.com/Wenszel))
- [iOS] Setting `player.currentTime` doesn't seek to the correct time on some videos. ([#37672](https://github.com/expo/expo/pull/37300) by [@petrkonecny2](https://github.com/petrkonecny2))
- [iOS] Fix tvOS compilation errors. ([#38085](https://github.com/expo/expo/pull/38085) by [@douglowder](https://github.com/douglowder))
- [Android] Fix: Respect accessibility settings for HLS subtitle sizing and system settings, added listener ([#38591](https://github.com/expo/expo/pull/38591) by [@hirbod](https://github.com/hirbod))
- [iOS] Fix inconsistent behavior of "replay" on iOS by calling "play()" after seeking to position 0. ([#38590](https://github.com/expo/expo/pull/38590)) by [@saviocmc](https://github.com/saviocmc)
- [web] Revert crossOrigin property for video to `undefined` ([#38818](https://github.com/expo/expo/pull/38818) by [@hirbod](https://github.com/hirbod)

### 💡 Others

- Export types using the `export type` syntax. ([#37396](https://github.com/expo/expo/pull/37396) by [@behenate](https://github.com/behenate))

## 2.2.2 - 2025-06-18

### 🐛 Bug fixes

- [Android] Fix aspect ratio of the Picture in Picture window when auto-entering for sources with ratio different from 16:9. ([#37225](https://github.com/expo/expo/pull/37225) by [@behenate](https://github.com/behenate))

## 2.2.1 - 2025-06-10

_This version does not introduce any user-facing changes._

## 2.2.0 - 2025-06-04

### 🎉 New features

- [Android][iOS] Added support for Audio Track feature. You can now set the audio track using `player.audioTrack` and list available audio tracks using `player.availableAudioTracks`. ([#36207](https://github.com/expo/expo/pull/36207) by [@HADeveloper](https://github.com/HADeveloper))

### 🐛 Bug fixes

- [Android] Fix `onFirstFrameRender` not being emitted for sources with `pixelWidthHeightRatio` different than 1. ([#37009](https://github.com/expo/expo/pull/37009) by [@behenate](https://github.com/behenate))
- [Android] Fix `useExoShutter` prop not being exposed to the JS side. ([#37012](https://github.com/expo/expo/pull/37012) by [@behenate](https://github.com/behenate))
- [Android] Add missing `onFirstFrameRender` event to the `VideoView` definition. ([#37014](https://github.com/expo/expo/pull/37014) by [@behenate](https://github.com/behenate))
- [iOS] Fix player not entering 'error' state when loading fails on iOS. ([#37177](https://github.com/expo/expo/pull/37177) by [@behenate](https://github.com/behenate))
- [iOS] Fix player reporting status `readyToPlay` while a source is being loaded asynchronously. ([#37180](https://github.com/expo/expo/pull/37180) by [@behenate](https://github.com/behenate))
- [iOS] Fix player going into `loading` status for a single frame when unpausing with a full buffer. ([#37181](https://github.com/expo/expo/pull/37181) by [@behenate](https://github.com/behenate))
- [iOS] Fix player getting stuck in `loading` state for null sources. ([#37183](https://github.com/expo/expo/pull/37183) by [@behenate](https://github.com/behenate))

## 2.1.9 — 2025-05-08

### 🛠 Breaking changes

- [web] Add crossOrigin prop, change default value to no CORS. ([#36713](https://github.com/expo/expo/pull/36713) by [@aleqsio](https://github.com/aleqsio))

## 2.1.8 — 2025-04-30

_This version does not introduce any user-facing changes._

## 2.1.7 — 2025-04-28

### 🎉 New features

- Introduce `replaceAsync` method, which doesn't load the asset on the main thread. ([#36308](https://github.com/expo/expo/pull/36308) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [iOS] Fix main thread being locked while the VideoPlayer is replacing or being created with a source. ([#36308](https://github.com/expo/expo/pull/36308) by [@behenate](https://github.com/behenate))

## 2.1.6 — 2025-04-25

### 🎉 New features

- [Android] Add an option to choose the surface type. ([#36212](https://github.com/expo/expo/pull/36212) by [@behenate](https://github.com/behenate))

## 2.1.5 — 2025-04-23

### 🎉 New features

- [web] Add playsInline prop ([#36335](https://github.com/expo/expo/pull/36335) by [@jakex7](https://github.com/jakex7))

## 2.1.4 — 2025-04-22

### 🎉 New features

- Add `contentType` field to `VideoSource`. ([#36234](https://github.com/expo/expo/pull/36234) by [@behenate](https://github.com/behenate))

## 2.1.3 — 2025-04-21

_This version does not introduce any user-facing changes._

## 2.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 2.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 2.1.0 — 2025-04-04

### 🎉 New features

- [Android][iOS] Added an option to `generateThumbnailsAsync` to set the maximum size of generated thumbnails. ([#33599](https://github.com/expo/expo/pull/33599) by [@tsapeta](https://github.com/tsapeta)), ([#33712](https://github.com/expo/expo/pull/33712) by [@behenate](https://github.com/behenate))
- [Android][iOS] Add support for listing available video tracks and currently played video track. ([#33458](https://github.com/expo/expo/pull/33458) by [@behenate](https://github.com/behenate))
- [Android][iOS] Add `sourceLoad` event. ([#33458](https://github.com/expo/expo/pull/33458) by [@behenate](https://github.com/behenate))
- [Android][iOS] Add caching functionality. ([#31781](https://github.com/expo/expo/pull/31781) by [@behenate](https://github.com/behenate))
- Add `onFirstFrameRender` event to the `VideoView`. ([#35346](https://github.com/expo/expo/pull/35346) by [@behenate](https://github.com/behenate))
- Add `useExoShutter` property to the `VideoView`. ([#35366](https://github.com/expo/expo/pull/35366) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [Android] Fix ConcurrentModificationException app crashes ([#35356](https://github.com/expo/expo/pull/35356) by [@voslartomas](https://github.com/voslartomas))
- [Web] Fix `playbackRate` not being applied in the setup function.([#34182](https://github.com/expo/expo/pull/34182) by [@behenate](https://github.com/behenate))
- Fix safe area insets not updating for native controls on iOS. ([#32864](https://github.com/expo/expo/pull/32864) by [@behenate](https://github.com/behenate))
- [iOS] Fix the Now Playing notification disappearing after the video is paused. ([#35273](https://github.com/expo/expo/pull/35273) by [@behenate](https://github.com/behenate))
- [iOS] Fix a race condition in setting the targets for the Now Playing controls causing the controls to sometimes not work. ([#35274](https://github.com/expo/expo/pull/35274) by [@behenate](https://github.com/behenate))
- [iOS] Fix disabling the Now Playing controls for multiple players at the same time causing the notification to break. ([#35275](https://github.com/expo/expo/pull/35275) by [@behenate](https://github.com/behenate))
- [Android] Fix touch events not being emitted for `VideoView`. ([#35479](https://github.com/expo/expo/pull/35479) by [@behenate](https://github.com/behenate))

### 💡 Others

- Fixed `generateThumbnailsAsync` not being available on Android in the types. ([#33491](https://github.com/expo/expo/pull/33491) by [@hirbod](https://github.com/hirbod))
- Run VideoManager.setAppropriateAudioSessionOrWarn on a different queue for a lower load on the main thread. ([#33127](https://github.com/expo/expo/pull/33127) by [@behenate](https://github.com/behenate))
- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] SharedRef: migrate from `pointer` to `ref` ([#30359](https://github.com/expo/expo/pull/30359) by [@behenate](https://github.com/behenate))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate)), ([#35428](https://github.com/expo/expo/pull/35428) by [@behenate](https://github.com/behenate))

## 2.0.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 2.0.4 - 2025-01-08

### 🐛 Bug fixes

- [iOS] Fix `AVPlayer` not deallocating when the player is unmounted. ([#33922](https://github.com/expo/expo/pull/33922) by [@behenate](https://github.com/behenate))

## 2.0.3 - 2024-12-19

### 🐛 Bug fixes

- [iOS] Fix empty notification showing on iOS when `showNowPlayingNotification` is set to false. ([#33698](https://github.com/expo/expo/pull/33698) by [@behenate](https://github.com/behenate))
- [iOS] Dispatch current player item changes on main queue to fix KVO-related crashes. ([#33123](https://github.com/expo/expo/pull/33123) by [@behenate](https://github.com/behenate))

## 2.0.2 - 2024-11-29

_This version does not introduce any user-facing changes._

## 2.0.1 — 2024-11-19

### 🐛 Bug fixes

- [Android] Fixed `border` related props weren't applied correctly. ([#33075](https://github.com/expo/expo/pull/33075) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fix controls sometimes flashing on initial display of the view, when `useNativeControls` is `false` ([#33238](https://github.com/expo/expo/pull/33238) by [@behenate](https://github.com/behenate))

## 2.0.0 — 2024-11-11

### 💡 Others

- [Android] Modify aspect ratio coverage of Android PiP to be more specific ([#32551](https://github.com/expo/expo/pull/32551) by [@YangJonghun](https://github.com/YangJonghun))

## 2.0.0-preview.2 — 2024-11-07

### 🎉 New features

- [Android][iOS] Add support for listing and selecting closed captions. ([#32582](https://github.com/expo/expo/pull/32582) by [@behenate](https://github.com/behenate))

## 2.0.0-preview.1 — 2024-11-05

### 🎉 New features

- [Android][iOS] Add `audioMixingMode` property to control how the player interacts with other audio in the system. ([#32428](https://github.com/expo/expo/pull/32428) by [@behenate](https://github.com/behenate))
- Add support for creating a direct instance of `VideoPlayer`. ([#32228](https://github.com/expo/expo/pull/32228) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [Android] Fix errors when passing a source with an `undefined` `uri` field. ([#32585](https://github.com/expo/expo/pull/32585) by [@behenate](https://github.com/behenate))

## 2.0.0-preview.0 — 2024-10-22

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
- [Android][iOS] Add support for video artwork. ([#32129](https://github.com/expo/expo/pull/32129) by [@AlirezaHadjar](https://github.com/AlirezaHadjar))

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
