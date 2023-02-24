# Changelog

## Unpublished

### 🛠 Breaking changes

- Import Metro dependencies directly from where ever the `expo/metro-config` package is being initialized. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `@unimodules` namespace from Exotic transformer. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))
- `expo-asset` is no longer optional. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Export `MetroConfig` type. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

### 💡 Others

- Drop `testing` and `native` from `resolver.platforms`. ([#21330](https://github.com/expo/expo/pull/21330) by [@EvanBacon](https://github.com/EvanBacon))

## 0.7.0 — 2023-02-14

### 🎉 New features

- Add `EXPO_USE_METRO_WORKSPACE_ROOT` to enable using the workspace root for serving files. ([#21088](https://github.com/expo/expo/pull/21088) by [@EvanBacon](https://github.com/EvanBacon))

## 0.6.0 — 2023-02-03

### 🎉 New features

- Ignore `react-dom` traces. ([#21005](https://github.com/expo/expo/pull/21005) by [@EvanBacon](https://github.com/EvanBacon))
- Add `avif` and `heic` to the default `resolver.assetExts` to support `expo-image`. ([#20893](https://github.com/expo/expo/pull/20893) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix Exotic support for Expo SDK 47 projects. ([#20827](https://github.com/expo/expo/pull/20827) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Remove `@expo/json-file`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
