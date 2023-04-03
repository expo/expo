# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Added `enableShrinkResourcesInReleaseBuilds` property to enable Android `shrinkResources` build feature. ([#21911](https://github.com/expo/expo/pull/21911) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

### 💡 Others

## 0.5.1 — 2023-02-09

### 🎉 New features

- Add support for enabling [Flipper](https://fbflipper.com/) as bundled with react-native. ([#20890](https://github.com/expo/expo/pull/20861) by [@jakobo](https://github.com/jakobo))

## 0.5.0 — 2023-02-03

### 🎉 New features

- Add support for enabling [React Native new architecture mode](https://reactnative.dev/docs/new-architecture-intro). ([#20861](https://github.com/expo/expo/pull/20861) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.4.1 - 2022-11-24

### 🐛 Bug fixes

- Fixed `extraProguardRules` be overwritten from multiple `withBuildProperties` execution. ([#20106](https://github.com/expo/expo/pull/20106) by [@kudo](https://github.com/kudo))

## 0.4.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.0 — 2022-07-07

### 🎉 New features

- Add `android.minSdkVersion` to override the minimum required Android SDK version. ([#17647](https://github.com/expo/expo/pull/17647) by [@Kudo](https://github.com/Kudo))
