# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 15.1.7 — 2025-07-01

### 🐛 Bug fixes

- Added Android 16KB page size support. ([#37446](https://github.com/expo/expo/pull/37446) by [@kudo](https://github.com/kudo))

## 15.1.6 — 2025-06-10

_This version does not introduce any user-facing changes._

## 15.1.5 — 2025-06-04

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 15.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 15.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 15.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 15.1.1 — 2025-04-09

### 💡 Others

- Expo AV has now been deprecated. ([#36020](https://github.com/expo/expo/pull/36020) by [@alanjhughes](https://github.com/alanjhughes))

## 15.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))

## 15.0.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 15.0.1 — 2024-10-24

### 💡 Others

- [android][docs] Add `AndroidOutputFormat` and `AndroidAudioEncoder` docs. ([#34022](https://github.com/expo/expo/pull/34022) by [@mateoguzmana](https://github.com/mateoguzmana))
- Added deprecation warning to the `Video` component. ([#32267](https://github.com/expo/expo/pull/32267) by [@tsapeta](https://github.com/tsapeta))

## 15.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [android] Add support for react-native 0.76 ([#31504](https://github.com/expo/expo/pull/31504) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- [iOS] `loadAsync()` promise never settled when given an invalid file uri ([#30020](https://github.com/expo/expo/pull/30020) by [@vonovak](https://github.com/vonovak))
- Fixed putting app to background stops non-mixable audio playback in other apps on iOS ([#20380](https://github.com/expo/expo/pull/20380) by [@de1acr0ix](https://github.com/de1acr0ix))
- Fix unhandled promise rejection when start recording fails [#29826](https://github.com/expo/expo/pull/29826) by [@anirudhsama](https://github.com/anirudhsama)
- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30456](https://github.com/expo/expo/pull/30456) by [@byCedric](https://github.com/byCedric))
- Add missing `react-native-web` optional peer dependency for isolated modules. ([#30689](https://github.com/expo/expo/pull/30689) by [@byCedric](https://github.com/byCedric))
- [Android] Fixed `NullPointerException` in the `installJSIBindings` function. ([#31464](https://github.com/expo/expo/pull/31464) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fixed crash when reloading an expo update with a video component mounted ([#31540](https://github.com/expo/expo/pull/31540) by [@AbijahKaj](https://github.com/AbijahKaj))

### 💡 Others

- Keep using the legacy event emitter as the module is not fully migrated to Expo Modules API. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Added support for React Native 0.75.x. ([#30034](https://github.com/expo/expo/pull/30034) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 14.0.6 - 2024-06-27

### 🐛 Bug fixes

- [iOS] Fixed broken Video view on New Architecture mode. ([#30030](https://github.com/expo/expo/pull/30030) by [@kudo](https://github.com/kudo))

## 14.0.5 — 2024-05-15

### 🐛 Bug fixes

- [Web] Fix `shouldCorrectPitch` being ignored on web. ([#28837](https://github.com/expo/expo/pull/28837) by [@behenate](https://github.com/behenate))

## 14.0.4 — 2024-05-09

### 🐛 Bug fixes

- [Android] Fix events being sent using a wrong event emitter. ([#28716](https://github.com/expo/expo/pull/28716) by [@behenate](https://github.com/behenate))

## 14.0.3 — 2024-05-01

_This version does not introduce any user-facing changes._

## 14.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 14.0.1 — 2024-04-19

_This version does not introduce any user-facing changes._

## 14.0.0 — 2024-04-18

### 🐛 Bug fixes

- [Android] Fix recording audio on Android after converting to Expo Modules ([#26657](https://github.com/expo/expo/pull/26657) by [@jpudysz](https://github.com/jpudysz))
- [Android] Fix memory leak connect with `AVManager`. ([#28159](https://github.com/expo/expo/pull/28159) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fix `HashMap cannot be cast to ReadableNativeMap` error on Android. ([#28317](https://github.com/expo/expo/pull/28317) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Prevent config plugin from writing permissions until prebuild. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 13.10.6 - 2024-04-18

### 🐛 Bug fixes

- Tried to fix unused recording permission and getting rejected by store review. ([#28236](https://github.com/expo/expo/pull/28236) by [@kudo](https://github.com/kudo))

## 13.10.5 - 2024-02-06

### 🐛 Bug fixes

- [iOS] Improve precision for syncing two videos and updating new video position when user sets tolerances to 0 ([#26018](https://github.com/expo/expo/pull/26018) by [@jpudysz](https://github.com/jpudysz))

## 13.10.4 - 2024-01-25

### 🐛 Bug fixes

- [Android] Add `Events` `to AVModule` to prevent event emitter warning. ([#26434](https://github.com/expo/expo/pull/26434) by [@alanjhughes](https://github.com/alanjhughes))

## 13.10.3 - 2024-01-18

_This version does not introduce any user-facing changes._

## 13.10.2 - 2024-01-10

### 💡 Others

- Replace deprecated `com.facebook.react:react-native:+` Android dependency with `com.facebook.react:react-android`. ([#26237](https://github.com/expo/expo/pull/26237) by [@kudo](https://github.com/kudo))

## 13.10.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 13.10.0 — 2023-12-12

### 🐛 Bug fixes

- [iOS] Fix base64 audio playback on iOS 17. ([#25414](https://github.com/expo/expo/pull/25414) by [@behenate](https://github.com/behenate))

### 💡 Others

- Bump C++ compiler setting to C++20. ([#25548](https://github.com/expo/expo/pull/25548) by [@kudo](https://github.com/kudo))

## 13.9.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fix audio recording resetting when receiving a phone call. ([#25054](https://github.com/expo/expo/pull/25054) by [@behenate](https://github.com/behenate))
- Fix iOS `naturalSize.orientation` in prop `onReadyForDisplay` for hls stream ([#25169](https://github.com/expo/expo/pull/25169) by [@souzaluiz](https://github.com/souzaluiz))

### 💡 Others

- Use `pointerEvent` style instead of prop for video component on web. ([#24931](https://github.com/expo/expo/pull/24931) by [@EvanBacon](https://github.com/EvanBacon))
- Remove deprecated `REACT_NATIVE_OVERRIDE_VERSION` for React Native nightly testing. ([#25151](https://github.com/expo/expo/pull/25151) by [@kudo](https://github.com/kudo))
- Removed backward compatible code for deprecated SDKs. ([#25154](https://github.com/expo/expo/pull/25154) by [@kudo](https://github.com/kudo))

## 13.8.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- Update pitch algorithm settings for iOS >= 17. ([#24678](https://github.com/expo/expo/pull/24678) by [@hromovp](https://github.com/hromovp))
- [iOS] fix compilation on tvOS. ([#24864](https://github.com/expo/expo/pull/24864) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 13.7.0 — 2023-09-15

### 🐛 Bug fixes

- [ios] Fixed the `LOW_QUALITY` preset producing large audio files. ([#24323](https://github.com/expo/expo/pull/24323) by [@behenate](https://github.com/behenate))

## 13.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed recording status not being reset when recording is paused before being stopping. ([#21747](https://github.com/expo/expo/issues/21747)) ([#23816](https://github.com/expo/expo/pull/23816) by [@mojavad](https://github.com/mojavad))
- Prevent audio from other apps being stopped when users app is backgrounded. ([#24198](https://github.com/expo/expo/pull/24198) by [@alanhughes](https://github.com/alanjhughes))

### 💡 Others

- Migrated `AVModule` to use Expo modules API. ([#23902](https://github.com/expo/expo/pull/23902) by [@lukmccall](https://github.com/lukmccall))

## 13.5.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 13.5.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 13.4.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 13.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 13.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 13.2.0 — 2023-02-03

### 🐛 Bug fixes

- Fixed `HTMLMediaElement.play` and `HTMLMediaElement.pause` calls on the Web aren't properly awaited. ([#20439](https://github.com/expo/expo/pull/20439)) by [@zhigang1992](https://github.com/zhigang1992)
- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))
- Fixed JSI audio sampling buffer issues when using `SimpleExoPlayer` implementation on Android. ([#21055](https://github.com/expo/expo/pull/21055) by [@kudo](https://github.com/kudo))
- Fixed compatibility with build-time React Native Web styling libraries. Removed `StyleSheet.flatten`. ([#21236](https://github.com/expo/expo/pull/21236)) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway)

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 13.1.0 — 2022-12-30

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
- Fixed crashes when ProGuard or R8 is enabled on Android. ([#20197](https://github.com/expo/expo/pull/20197) by [@lukmccall](https://github.com/lukmccall))
- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))

## 13.0.2 - 2022-11-29

### 🐛 Bug fixes

- Fixed error for duplicated META-INF files when building on Android. ([#20251](https://github.com/expo/expo/pull/20251) by [@kudo](https://github.com/kudo))

## 13.0.1 — 2022-10-30

### 🎉 New features

- Added `PosterComponent` prop to `Video` component. ([#19625](https://github.com/expo/expo/pull/19625) by [@youedd](https://github.com/youedd)

## 13.0.0 — 2022-10-25

_This version does not introduce any user-facing changes._

## 13.0.0-beta.1 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added support for audio panning on Android (MediaPlayer implementation only) via `audioPan` prop. ([#15530](https://github.com/expo/expo/pull/15530) by [@DominickVale](https://github.com/DominickVale))
- Added `videoStyle` prop for Video component. ([#18549](https://github.com/expo/expo/pull/18549) by [@alantoa](https://github.com/alantoa))
- Native module for video view is now written in Swift using the new API. ([#18633](https://github.com/expo/expo/pull/18633) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed promise rejection catching when `Video` is unmounted. ([#18471](https://github.com/expo/expo/pull/18471) by [@barthap](https://github.com/barthap))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))
- Remove unnecessary CocoaPods dependency on `ReactCommon` and `React-runtimeexecutor`. ([#19067](https://github.com/expo/expo/pull/19067) by [@tsapeta](https://github.com/tsapeta))

### 📚 3rd party library updates

- Upgraded ExoPlayer dependencies to 2.18.1 on Android. ([#19332](https://github.com/expo/expo/pull/19332) by [@kudo](https://github.com/kudo))

## 12.0.2 — 2022-07-18

### 🐛 Bug fixes

- Fixed unhandled promise rejection when `Video` is unmounted. ([#18281](https://github.com/expo/expo/pull/18281) by [@barthap](https://github.com/barthap))

## 12.0.1 — 2022-07-16

### 🐛 Bug fixes

- Automatically unload `Video` component before React Native initiates an unmount to prevent memory leak crashes. ([#18173](https://github.com/expo/expo/pull/18173) by [@hirbod](https://github.com/hirbod) and [@Pickleboyonline](https://github.com/Pickleboyonline))

## 12.0.0 — 2022-07-07

### 🛠 Breaking changes

- Replace `RecordingOptions` related constants with enums. Check out the PR for the migration hints. ([#17954](https://github.com/expo/expo/pull/17954) by [@Simek](https://github.com/Simek))
- Rename the `RecordingOptions` preset constant to `RecordingOptionsPresets` and edit export. Check out the PR for the migration hints. ([#17954](https://github.com/expo/expo/pull/17954) by [@Simek](https://github.com/Simek))

### 🐛 Bug fixes

- On Android fix `Video` component crashes when activity loses focus due to accessing player from the wrong thread. ([#17280](https://github.com/expo/expo/pull/17280) by [@mnightingale](https://github.com/mnightingale))
- Added support for React Native 0.69.x. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))
- On Android fix `Audio.setAudioModeAsync` and `Audio.setIsEnabledAsync` crashes due to accessing player from the wrong thread. ([#17840](https://github.com/expo/expo/pull/17840) by [@mnightingale](https://github.com/mnightingale))

### 💡 Others

- Extract types defined in `createAsync` methods return to separate types: `RecordingObject` and `SoundObject`. ([#17954](https://github.com/expo/expo/pull/17954) by [@Simek](https://github.com/Simek))
- Extract platform related nested object types from `RecordingOptions` to the separate types: `RecordingOptionsAndroid`, `RecordingOptionsIOS` and `RecordingOptionsWeb`. ([#17954](https://github.com/expo/expo/pull/17954) by [@Simek](https://github.com/Simek))

## 11.2.2 — 2022-04-27

### 🐛 Bug fixes

- Fixed displaying warning about `Sound.setOnAudioSampleReceived` unavailable when debugging remotely. ([#17210](https://github.com/expo/expo/pull/17210) by [@barthap](https://github.com/barthap))
- Fixed crash when remote debugging is enabled on Android. ([#17212](https://github.com/expo/expo/pull/17212) by [@barthap](https://github.com/barthap))

## 11.2.1 — 2022-04-20

### 🐛 Bug fixes

- On iOS fix crash caused by updating `AVPlaybackStatus` from both `<Video />` props and the Playback API at the same time. Also prevented a crash on iOS caused by removing the Video without unlisting its underlying native `EXAVPlayerData` as an observer. ([#17036](https://github.com/expo/expo/pull/17036) by [@Pickleboyonline](https://github.com/Pickleboyonline))

## 11.2.0 — 2022-04-18

### 🎉 New features

- Add new `Sound.setOnAudioSampleReceived` API to support streaming audio sample buffers in realtime. ([#14904](https://github.com/expo/expo/pull/14904), [#16075](https://github.com/expo/expo/pull/16075) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- On Android fix crashes caused by accessing player from the wrong thread ([#16611](https://github.com/expo/expo/pull/16611) by [@mnightingale](https://github.com/mnightingale))

### 💡 Others

- Extract `tolerances` param type definition, used across the package methods, to the separate type `AVPlaybackTolerance`. ([#16905](https://github.com/expo/expo/pull/16905) by [@Simek](https://github.com/Simek))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.0 — 2022-03-10

### 🐛 Bug fixes

- On iOS fix `pauseAsync` causing framedrops and being delayed by not disabling `AVAudioSession` when there is no need for it ([#15873](https://github.com/expo/expo/pull/15873) by [@hirbod](https://github.com/hirbod) and [@mnightingale](https://github.com/mnightingale))

## 11.0.1 — 2022-03-07

### 🐛 Bug fixes

- Fix local asset localUri not being used in development ([#16544](https://github.com/expo/expo/pull/16544) by [@mnightingale](https://github.com/mnightingale))

## 11.0.0 — 2022-03-03

### 🛠 Breaking changes

- Remove `Video` component's static constants `FULLSCREEN_UPDATE_PLAYER_WILL_RESENT`, `FULLSCREEN_UPDATE_PLAYER_DID_RESENT`, `FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS`, `FULLSCREEN_UPDATE_PLAYER_DID_DISMISS` and replace them with new `VideoFullscreenUpdate` enum. ([#16059](https://github.com/expo/expo/pull/16059) by [@Simek](https://github.com/Simek))
- Remove `Video` component's static constants `RESIZE_MODE_CONTAIN`, `RESIZE_MODE_COVER`, `RESIZE_MODE_STRETCH`. Use `ResizeMode` enum values instead. ([#16059](https://github.com/expo/expo/pull/16059) by [@Simek](https://github.com/Simek))
- Remove deprecated `presentIOSFullscreenPlayer` and `dismissIOSFullscreenPlayer` method from `Video` component. ([#16059](https://github.com/expo/expo/pull/16059) by [@Simek](https://github.com/Simek))
- Remove deprecated `onIOSFullscreenUpdate` prop from `Video` component. ([#16059](https://github.com/expo/expo/pull/16059) by [@Simek](https://github.com/Simek))
- Remove unused `presentFullscreenPlayerAsync` method from `Video` component. ([#16059](https://github.com/expo/expo/pull/16059) by [@Simek](https://github.com/Simek))
- Remove `INTERRUPTION_MODE_*` constants in favor of `InterruptionModeAndroid` and `InterruptionModeIOS` enums. ([#16145](https://github.com/expo/expo/pull/16145) by [@Simek](https://github.com/Simek))
- On Android upgrade `com.google.android.exoplayer:*:2.9.2` (available from `jcenter()`) to `com.google.android.exoplayer:*:2.13.3` (available from `google()`). ([#16123](https://github.com/expo/expo/pull/16123) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Add methods to get and set audio recording inputs. ([#15806](https://github.com/expo/expo/pull/15806) by [@computerjazz](https://github.com/computerjazz))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Add missing `AudioMode` type export. ([#16145](https://github.com/expo/expo/pull/16145) by [@Simek](https://github.com/Simek))

## 10.2.1 - 2022-02-01

### 🐛 Bug fixes

- Fix iOS build with Expo SDK 44 and React Native 0.65+. ([#15661](https://github.com/expo/expo/pull/15661) by [@schiller-manuel](https://github.com/schiller-manuel))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.2.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 10.1.3 — 2021-11-01

### 🐛 Bug fixes

- On Web, do not try to attach fullscreen listener, when component `ref` is `null`. ([#14713](https://github.com/expo/expo/pull/14713) by [@Simek](https://github.com/Simek))

### 💡 Others

- Update component types and event types. ([#14713](https://github.com/expo/expo/pull/14713) by [@Simek](https://github.com/Simek))
- Mark `status` as an optional field in `VideoFullscreenUpdateEvent` and `VideoReadyForDisplayEvent` types, becouse Web implementation do not return `status` in those events. ([#14713](https://github.com/expo/expo/pull/14713) by [@Simek](https://github.com/Simek))

## 10.1.2 — 2021-10-21

### 🐛 Bug fixes

- Fix require cycles ([#14820](https://github.com/expo/expo/pull/14820) by [@EvanBacon](https://github.com/EvanBacon))

## 10.1.1 — 2021-10-15

_This version does not introduce any user-facing changes._

## 10.1.0 — 2021-10-01

### 🐛 Bug fixes

- Fixed `JNI DETECTED ERROR IN APPLICATION: java_object == null in call to GetObjectClass from void versioned.host.exp.exponent.modules.api.reanimated.NativeProxy$EventHandler.receiveEvent` on Android. ([#14569](https://github.com/expo/expo/pull/14569) by [@lukmccall](https://github.com/lukmccall))

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Default audio recording settings on ios are now `extension: '.m4a'` and `outputFormat: RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC` so as to ensure cross-platform compatibility. ([#13492](https://github.com/expo/expo/pull/13492) by [@actuallymentor](https://github.com/actuallymentor))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- [plugin] Added ability to disable microphone permission via `microphonePermission: false`. ([#13446](https://github.com/expo/expo/pull/13446) by [@EvanBacon](https://github.com/EvanBacon))
- Add web support for recording. ([#8721](https://github.com/expo/expo/pull/8721) by [@WazzaJB](https://github.com/WazzaJB) and [@mnightingale](https://github.com/mnightingale))
- Add permissions support for web. ([#8721](https://github.com/expo/expo/pull/8721) by [@mnightingale](https://github.com/mnightingale))
- Add Audio `usePermissions` hook from modules factory. ([#13851](https://github.com/expo/expo/pull/13851) by [@bycedric](https://github.com/bycedric))
- On iOS, add Audio metadata (title) updates via `setOnMetadataUpdate`. ([#14134](https://github.com/expo/expo/pull/14134) by [@dani-mp](https://github.com/dani-mp))

### 🐛 Bug fixes

- Fix inline playback on Safari iOS (web). ([#13628](https://github.com/expo/expo/pull/13628) by [@andreibarabas](https://github.com/andreibarabas) and [@IjzerenHein](https://github.com/IjzerenHein))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13745](https://github.com/expo/expo/pull/13745) by [@tsapeta](https://github.com/tsapeta))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 9.2.3 — 2021-06-30

### 🎉 New features

- [plugin] Added Android `android.permission.MODIFY_AUDIO_SETTINGS` permission. ([#13163](https://github.com/expo/expo/pull/13163) by [@EvanBacon](https://github.com/EvanBacon))
- Remove lodash and nullthrows. ([#12522](https://github.com/expo/expo/pull/12522) by [@EvanBacon](https://github.com/EvanBacon))
- Add new `Recording.createAsync` API for faster recording on iOS. ([#12294](https://github.com/expo/expo/pull/12294) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add `keepAudioActiveHint` recording option to prevent deactivation of the Audio session when recording on iOS. ([#12294](https://github.com/expo/expo/pull/12294) by [@IjzerenHein](https://github.com/IjzerenHein))
- Allow video audio to continue to play in the background on iOS. ([#12950](https://github.com/expo/expo/pull/12950) by [@matt-oakes](https://github.com/matt-oakes))

### 🐛 Bug fixes

- Fixed the web Video Fullscreen APIs in Safari ([#12258](https://github.com/expo/expo/pull/12258) by [@elliotdickison](https://github.com/elliotdickison))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Fixed an issue with Audio Interruption Mode not correctly being set on Android. ([#13236](https://github.com/expo/expo/pull/13236) by [@matt-oakes](https://github.com/matt-oakes))

### 💡 Others

- Migrated from `unimodules-file-system-interface` and `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 9.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 9.0.0 — 2021-01-14

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))
- Add optional sound level information in `RecordingStatus` object described with `metering` key. Add `isMeteringEnabled` flag in `RecordingOptions` to enable computing this information. The flag is set to `true` by default in `RecordingOptions` presets (`RECORDING_OPTIONS_PRESET_HIGH_QUALITY`, `RECORDING_OPTIONS_PRESET_LOW_QUALITY`). ([#10759](https://github.com/expo/expo/pull/10759) by [@danieloi](https://github.com/danieloi))

### 🐛 Bug fixes

- Fixed minor syntax error in `AVManager`. ([#11375](https://github.com/expo/expo/pull/11375) by [@sjchmiela](https://github.com/sjchmiela))

## 8.7.0 — 2020-11-17

### 🐛 Bug fixes

- Fix orientation being returned incorrectly for videos in portrait mode in onReadyForDisplay on iOS. ([#10449](https://github.com/expo/expo/pull/10449) by [@lachenmayer](https://github.com/lachenmayer))
- Fix looping stops after 3 times on iOS. ([#10602](https://github.com/expo/expo/pull/10602) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix Audio.stopAndUnloadAsync not handling no-data on Android. ([#9877](https://github.com/expo/expo/pull/9877) by [@IjzerenHein](https://github.com/IjzerenHein))

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
