# Changelog

## Unpublished

### 🛠 Breaking changes

- Add support for config.updates.useClassicUpdates defaulting behavior. ([#22169](https://github.com/expo/expo/pull/22169) by [@wschurman](https://github.com/wschurman))

### 🎉 New features

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
