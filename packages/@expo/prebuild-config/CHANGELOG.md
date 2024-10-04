# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 6.3.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 6.2.4 — 2023-06-27

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 6.2.3 — 2023-06-24

### 🐛 Bug fixes

- Removed the deprecated `withPackageManifest` plugin to fix build warning on Android. ([#23056](https://github.com/expo/expo/pull/23056) by [@kudo](https://github.com/kudo))

## 6.2.2 — 2023-06-23

### 💡 Others

- Update snapshots. ([#23043](https://github.com/expo/expo/pull/23043) by [@alanjhughes](https://github.com/alanjhughes))

## 6.2.1 — 2023-06-22

### 🛠 Breaking changes

- Generate universal 1024x1024 iOS icon only. Supports [Xcode +14 only](https://developer.apple.com/documentation/xcode-release-notes/xcode-14-release-notes), min iOS 12, min watchOS 4. ([#22833](https://github.com/expo/expo/pull/22833) by [@EvanBacon](https://github.com/EvanBacon))

## 6.2.0 — 2023-06-21

### 💡 Others

- Update `xml2js` version. ([#22872](https://github.com/expo/expo/pull/22872) by [@EvanBacon](https://github.com/EvanBacon))

## 6.1.0 — 2023-06-13

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

## 6.0.2 — 2023-05-08

### 💡 Others

- Update tests to use latest Expo template. ([#21339](https://github.com/expo/expo/pull/21339) by [@EvanBacon](https://github.com/EvanBacon))
- Update build files. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))

## 6.0.1 - 2023-04-26

### 🐛 Bug fixes

- Fix missing `await` syntax that was causing build error for `android.adapative.monochromeImage` field, if specified in `app.json`. [#22000](https://github.com/expo/expo/pull/22000) by [@amandeepmittal](https://github.com/amandeepmittal))

## 6.0.0 — 2023-02-03

### 🛠 Breaking changes

- Removed deprecated facebook types and plugins. ([#21018](https://github.com/expo/expo/pull/21018) by [@byCedric](https://github.com/expo/expo/pull/21018))

### 🎉 New features

- Switch default JS engine to Hermes. ([#21001](https://github.com/expo/expo/pull/21001) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Bump `@expo/json-file`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
- Removed warning about the (deprecated property) `expo.ios.splash.xib` being unsupported. ([#20377](https://github.com/expo/expo/pull/20377) by [@EvanBacon](https://github.com/EvanBacon))
- Fix tests. ([#20379](https://github.com/expo/expo/pull/20379) by [@EvanBacon](https://github.com/EvanBacon))
