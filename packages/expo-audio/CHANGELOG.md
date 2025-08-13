# Changelog

## Unpublished

### 🛠 Breaking changes

- [iOS][Android][Web]: Change `useAudioPlayer` and `createAudioPlayer` to accept options object as second parameter instead of `updateInterval`. Moved `updateInterval` to options and add `downloadFirst` option for pre-downloading assets ([#38563](https://github.com/expo/expo/pull/38563) by [@hirbod](https://github.com/hirbod))

### 🎉 New features

- [Android] Add support for `recordForDuration`. ([#38405](https://github.com/expo/expo/pull/38405) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS][Android][Web]: Add downloadFirst option for audio playback and update related documentation ([#38563](https://github.com/expo/expo/pull/38563) by [@hirbod](https://github.com/hirbod))

### 🐛 Bug fixes

- [iOS] Fix connected bluetooth devices not playing back recordings. ([#37580](https://github.com/expo/expo/pull/37580) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Exclude setting `.allowBluetooth` on tvOS. ([#37950](https://github.com/expo/expo/pull/37950) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Prevent autoplaying when setting the playback rate. ([#38293](https://github.com/expo/expo/pull/38293) by [@alanjhughes](https://github.com/alanjhughes))
- Add shallow state comparison to prevent unnecessary re-renders in `useAudioRecorderState`. ([#38273](https://github.com/expo/expo/pull/38273) by [@alanjhughes](https://github.com/alanjhughes))
- [web] Fixed broken player state when `replace` was called while audio was running, added missing `updateInterval` to web, and improved audio status event emitting. ([#38505](https://github.com/expo/expo/pull/38505) by [@hirbod](https://github.com/hirbod))
- [android][iOS][web] Fix recordForDuration status updates and add new record() options API ([#38612](https://github.com/expo/expo/pull/38612) by [@hirbod](https://github.com/hirbod))
- [android]: Handle exceptions when retrieving maxAmplitude from MediaRecorder ([#38690](https://github.com/expo/expo/pull/38690) by [@hirbod](https://github.com/hirbod))
- [iOS] Report correct playback rate. ([#38729](https://github.com/expo/expo/pull/38729) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- Fix resolving issues with AudioEventKeys on webpack. Export mark types export with `type`. ([#37421](https://github.com/expo/expo/pull/37421) by [@behenate](https://github.com/behenate))
- [iOS] Throw an error when attempting to record when recording is not allowed. ([#37929](https://github.com/expo/expo/pull/37929) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.8 - 2025-07-03

### 🎉 New features

- [iOS] Support setting seek tolerences when calling `seekTo` on the player. ([#37669](https://github.com/expo/expo/pull/37669) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- [Android] Fix issues with audio focus management. ([#37698](https://github.com/expo/expo/pull/37698) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Fix connected bluetooth devices not playing back recordings. ([#37580](https://github.com/expo/expo/pull/37580) by [@alanjhughes](https://github.com/alanjhughes))
- Fix issue where the currentTime is out of sync when seeking before playing. ([#37668](https://github.com/expo/expo/pull/37668) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Fix ducking behaviour. ([#37788](https://github.com/expo/expo/pull/37788) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.7 - 2025-06-26

### 🐛 Bug fixes

- [iOS] Fixed status property bug when track finishes ([#37389](https://github.com/expo/expo/pull/37389) by [@adiktiv](https://github.com/adiktiv))
- [iOS] Fix inconsistent audio sampling. ([#37154](https://github.com/expo/expo/pull/37154) by [@alanjhughes](https://github.com/alanjhughes))
- Add automatic interruption handling. ([#37153](https://github.com/expo/expo/pull/37153) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS]: Fix changing pitch algorithm stops the playback if sampling is enabled ([#37320](https://github.com/expo/expo/pull/37320) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Improve audio tap memory safety and cleanup ([#37174](https://github.com/expo/expo/pull/37174) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Fix unused recording permission causing app store rejection. ([#37457](https://github.com/expo/expo/pull/37457) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Prevent status updates when the player is paused. ([#37475](https://github.com/expo/expo/pull/37475) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Change component registry to be per module to prevent interference. ([#37534](https://github.com/expo/expo/pull/37534) by [@alanjhughes](https://github.com/alanjhughes))
- Fix metering issues when recording. ([#37556](https://github.com/expo/expo/pull/37556) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [iOS] Accurately restore volume after interruption. ([#37444](https://github.com/expo/expo/pull/37444) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Switch audio tap processing effects from pre to post so volume is taken into account. ([#37461](https://github.com/expo/expo/pull/37461) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.6 - 2025-06-04

### 🐛 Bug fixes

- [iOS] Support base64 strings as an audio source. ([#37031](https://github.com/expo/expo/pull/37031) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Correctly add the http headers to the `AVURLAsset`. ([#37029](https://github.com/expo/expo/pull/37029) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.5 — 2025-05-08

### 🐛 Bug fixes

- [Android] Correctly handle recording URL's and local assets in production. ([#36737](https://github.com/expo/expo/pull/36737) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Run player updates on the main thread in the `audioFocusChangeListener`. ([#36957](https://github.com/expo/expo/pull/36957) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.4.3 — 2025-04-25

### 💡 Others

- [Android] Support manual audio focus control on `Android`. ([#36221](https://github.com/expo/expo/pull/36221) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.4.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.4.0 — 2025-04-04

### 🎉 New features

- [iOS] Add Apple TV support. ([#33365](https://github.com/expo/expo/pull/33365) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- [Android] Remove maxSdkVersion from MODIFY_AUDIO_SETTINGS permission ([#35541](https://github.com/expo/expo/pull/35541) by [@jakex7](https://github.com/jakex7))
- Use the same prop name for "muted" on all platforms. Fix playing in background on iOS.([#35600](https://github.com/expo/expo/pull/35600) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Recording was not working when prepared due to wrong precondition check ([#35591](https://github.com/expo/expo/pull/35591) by [@pennersr](https://github.com/pennersr))
- [Android] Correctly handle muting and volume. ([#35631](https://github.com/expo/expo/pull/35631) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Fix replacing item when `useAudioPlayer` is passed an empty source. ([#35749](https://github.com/expo/expo/pull/35749) by [@alanjhughes](https://github.com/alanjhughes))
- Return `currentTime` and `duration` in seconds across all platforms. ([#35787](https://github.com/expo/expo/pull/35787) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 0.3.5 - 2025-02-19

_This version does not introduce any user-facing changes._

## 0.3.4 - 2025-01-19

### 💡 Others

- [Android] Add checks to methods that will throw without permissions being granted. ([#33986](https://github.com/expo/expo/pull/33986) by [@alanjhughes](https://github.com/alanjhughes))

## 0.3.3 - 2025-01-10

### 🎉 New features

- Add new `didJustFinish` property to `AudioStatus`. ([#34089](https://github.com/expo/expo/pull/34089) by [@alanjhughes](https://github.com/alanjhughes))

## 0.3.2 - 2025-01-08

### 🐛 Bug fixes

- Expose `isMeteringEnabled` to `JS`. ([#33713](https://github.com/expo/expo/pull/33713) by [@alanjhughes](https://github.com/alanjhughes))
- On `Android`, allow player to accept a `null` audio source. ([#33854](https://github.com/expo/expo/pull/33854) by [@alanjhughes](https://github.com/alanjhughes))
- Override the `replace` method on the `AudioPlayer` so the source can be parsed correctly. ([#33708](https://github.com/expo/expo/pull/33708) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Remove unused `setAudioMode()` parameters. ([#34031](https://github.com/expo/expo/pull/34031) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Improvements in recording handling. ([#34841](https://github.com/expo/expo/pull/34841) by [@alanjhughes](https://github.com/alanjhughes))
- Fix `AudioMode` defaults. ([#34920](https://github.com/expo/expo/pull/34920) by [@alanjhughes](https://github.com/alanjhughes))

## 0.3.1 - 2024-12-16

### 🐛 Bug fixes

- Update docs and API so all units of time are returned as seconds, not milliseconds. ([#33320](https://github.com/expo/expo/pull/33320) by [@alanjhughes](https://github.com/alanjhughes))
- Fix `AudioSource` to accept numbers for loading local assets. ([#33676](https://github.com/expo/expo/pull/33676) by [@alanjhughes](https://github.com/alanjhughes))

## 0.3.0 - 2024-12-02

### 🎉 New features

- Support creating an `AudioPlayer` instance without using the `useAudioPlayer` hook. ([#33331](https://github.com/expo/expo/pull/33331) by [@alanjhughes](https://github.com/alanjhughes))

## 0.2.4 — 2024-11-19

### 🎉 New features

- Add support for replacing the auido source without recreating the player. ([#32981](https://github.com/expo/expo/pull/32981) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [Android] Imporve handling of `Visulaizer`. ([#33018](https://github.com/expo/expo/pull/33018) by [@alanjhughes](https://github.com/alanjhughes))

## 0.2.3 — 2024-10-28

_This version does not introduce any user-facing changes._

## 0.2.2 — 2024-10-24

_This version does not introduce any user-facing changes._

## 0.2.1 — 2024-10-24

_This version does not introduce any user-facing changes._

## 0.2.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30455](https://github.com/expo/expo/pull/30455) by [@byCedric](https://github.com/byCedric))

## 0.1.0 — 2024-04-18

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
