# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- [iOS] Add Apple TV support. ([#33365](https://github.com/expo/expo/pull/33365) by [@douglowder](https://github.com/douglowder))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#33779](https://github.com/expo/expo/pull/33779) by [@reichhartd](https://github.com/reichhartd))

### 🐛 Bug fixes

- Update docs and API so all units of time are returned as seconds, not milliseconds. ([#33320](https://github.com/expo/expo/pull/33320) by [@alanjhughes](https://github.com/alanjhughes))
- Fix `AudioSource` to accept numbers for loading local assets. ([#33676](https://github.com/expo/expo/pull/33676) by [@alanjhughes](https://github.com/alanjhughes))
- Expose `isMeteringEnabled` to `JS`. ([#33713](https://github.com/expo/expo/pull/33713) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

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
