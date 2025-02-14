# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- [iOS] Add Apple TV support. ([#33365](https://github.com/expo/expo/pull/33365) by [@douglowder](https://github.com/douglowder))
- Add new `didJustFinish` property to `AudioStatus`. ([#34089](https://github.com/expo/expo/pull/34089) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Expose `isMeteringEnabled` to `JS`. ([#33713](https://github.com/expo/expo/pull/33713) by [@alanjhughes](https://github.com/alanjhughes))
- On `Android`, allow player to accept a `null` audio source. ([#33854](https://github.com/expo/expo/pull/33854) by [@alanjhughes](https://github.com/alanjhughes))
- Override the `replace` method on the `AudioPlayer` so the source can be parsed correctly. ([#33708](https://github.com/expo/expo/pull/33708) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Remove unused `setAudioMode()` parameters. ([#34031](https://github.com/expo/expo/pull/34031) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Improvements in recording handling. ([#34841](https://github.com/expo/expo/pull/34841) by [@alanjhughes](https://github.com/alanjhughes))
- Fix `AudioMode` defaults.

### 💡 Others

- [Android] Add checks to methods that will throw without permissions being granted. ([#33986](https://github.com/expo/expo/pull/33986) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

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
