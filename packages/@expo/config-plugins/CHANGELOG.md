# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 7.2.1 — 2023-06-24

### 🐛 Bug fixes

- Removed the deprecated `withPackageManifest` plugin to fix build warning on Android. ([#23056](https://github.com/expo/expo/pull/23056) by [@kudo](https://github.com/kudo))

## 7.2.0 — 2023-06-21

### 💡 Others

- Update `xml2js` version. ([#22872](https://github.com/expo/expo/pull/22872) by [@EvanBacon](https://github.com/EvanBacon))

## 7.1.0 — 2023-06-13

### 🎉 New features

- Enable `CADisableMinimumFrameDurationOnPhone` by default. ([#22751](https://github.com/expo/expo/pull/22751) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Update `Target.findApplicationTargetWithDependenciesAsync` to mark framework targets as non-signable. ([#22454](https://github.com/expo/expo/pull/22454) by [@dsokal](https://github.com/dsokal))

### 💡 Others

- Update snapshots. ([#22748](https://github.com/expo/expo/pull/22748) by [@EvanBacon](https://github.com/EvanBacon))
- Update snapshots. ([#23043](https://github.com/expo/expo/pull/23043) by [@alanjhughes](https://github.com/alanjhughes))

## 7.0.0 — 2023-05-08

### 🛠 Breaking changes

- Add support for config.updates.useClassicUpdates defaulting behavior. ([#22169](https://github.com/expo/expo/pull/22169) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Add missing updates.checkAutomatically values. ([#22119](https://github.com/expo/expo/pull/22119) by [@douglowder](https://github.com/douglowder))
- Default to `['dangerous']` sorting on arbitrary platforms. ([#22224](https://github.com/expo/expo/pull/22224) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Make platform types more abstract. ([#22209](https://github.com/expo/expo/pull/22209) by [@EvanBacon](https://github.com/EvanBacon))
- Update snapshots. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- Update tests. ([#21396](https://github.com/expo/expo/pull/21396) by [@EvanBacon](https://github.com/EvanBacon))
- Update tests to use latest Expo template. ([#21339](https://github.com/expo/expo/pull/21339) by [@EvanBacon](https://github.com/EvanBacon))
- Update snapshots. ([#22032](https://github.com/expo/expo/pull/22032) by [@EvanBacon](https://github.com/EvanBacon))

## 6.0.0 — 2023-02-03

### 🛠 Breaking changes

- Removed support for deprecated `expo.ios.config.googleSignIn.reservedClientId` in favor of `expo.ios.googleServicesFile`. ([#20376](https://github.com/expo/expo/pull/20376) by [@EvanBacon](https://github.com/EvanBacon))
- Renamed `IOSConfig.Google.getGoogleSignInReservedClientId` to `IOSConfig.Google.getGoogleSignInReversedClientId`. ([#20376](https://github.com/expo/expo/pull/20376) by [@EvanBacon](https://github.com/EvanBacon))
- Renamed `IOSConfig.Google.setGoogleSignInReservedClientId` to `IOSConfig.Google.setGoogleSignInReversedClientId`. ([#20376](https://github.com/expo/expo/pull/20376) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated facebook types and plugins. ([#21018](https://github.com/expo/expo/pull/21018) by [@byCedric](https://github.com/expo/expo/pull/21018))

### 🎉 New features

- Switch default JS engine to Hermes. ([#21001](https://github.com/expo/expo/pull/21001) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- Bump `@expo/json-file`, `@expo/plist`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- Deprecate `expo.jsEngine` in **android/gradle.properties** and use `hermesEnabled` instead. (([#21067](https://github.com/expo/expo/pull/21067) by [@kudo](https://github.com/kudo))
