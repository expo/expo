# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add fast reset system for serialized mods.

### 🐛 Bug fixes

### 💡 Others

- Remove classic updates SDK version and release channel. ([#26061](https://github.com/expo/expo/pull/26061), [#26065](https://github.com/expo/expo/pull/26065) by [@wschurman](https://github.com/wschurman))
- [expo-updates] Remove unused methods. ([#26810](https://github.com/expo/expo/pull/26810) by [@wschurman](https://github.com/wschurman))

### 📚 3rd party library updates

- update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 7.8.4 - 2024-01-18

### 💡 Others

- Added a `finalized` mod that will run after all the other mods. ([#26413](https://github.com/expo/expo/pull/26413) by [@kudo](https://github.com/kudo))

## 7.8.3 - 2024-01-05

_This version does not introduce any user-facing changes._

## 7.8.2 - 2023-12-19

### 🐛 Bug fixes

- Add missing `slugify` dependency. ([#26019](https://github.com/expo/expo/pull/26019) by [@byCedric](https://github.com/byCedric))

## 7.8.1 — 2023-12-15

### 🐛 Bug fixes

- Fixed bug on mergeContents when tags have the same prefix. ([#25972](https://github.com/expo/expo/pull/25972) by [@alfonsocj](https://github.com/alfonsocj))
- Separate out runtime version setting method for eas-cli. ([#25874](https://github.com/expo/expo/pull/25874) by [@wschurman](https://github.com/wschurman))

## 7.8.0 — 2023-12-12

### 🎉 New features

- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- `ios.bundleIdentifier` will now only be set on the main `.pbxproj` file, using the serial `withXcodeProject` modifier. ([#25490](https://github.com/expo/expo/pull/25490) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25417](https://github.com/expo/expo/pull/25417) by [@byCedric](https://github.com/byCedric))

## 7.7.0 — 2023-11-14

### 🐛 Bug fixes

- Only modify quoted or prefixed android package names. ([#24559](https://github.com/expo/expo/pull/24559) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Update tests. ([#25211](https://github.com/expo/expo/pull/25211) by [@EvanBacon](https://github.com/EvanBacon))

## 7.6.0 — 2023-10-17

### 💡 Others

- Added a new type `ManifestQuery` to model the top-level `<queries>` tag in the App Manifest. ([#24619](https://github.com/expo/expo/pull/24619) by [@alanjhughes](https://github.com/alanjhughes))

## 7.5.0 — 2023-09-15

### 🛠 Breaking changes

- Replace `getRuntimeVersion` / `getRuntimeVersionNullable` with `getRuntimeVersionAsync` / `getRuntimeVersionNullableAsync`. ([#24126](https://github.com/expo/expo/pull/24126) by [@mccraveiro](https://github.com/mccraveiro))

### 🎉 New features

- Add fingerprintExperimental runtime version policy. ([#24126](https://github.com/expo/expo/pull/24126) by [@mccraveiro](https://github.com/mccraveiro))

### 🐛 Bug fixes

- [iOS] Fix DeviceFamily.ts to work for Apple TV. ([#24411](https://github.com/expo/expo/pull/24411) by [@douglowder](https://github.com/douglowder))

## 7.4.0 — 2023-09-04

### 🛠 Breaking changes

- Remove classic updates. ([#24066](https://github.com/expo/expo/pull/24066) by [@wschurman](https://github.com/wschurman))

## 7.3.1 — 2023-08-02

### 💡 Others

- Update tests with latest fixtures. ([#23763](https://github.com/expo/expo/pull/23763) by [@EvanBacon](https://github.com/EvanBacon))

## 7.3.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 7.2.4 - 2023-06-30

### 🎉 New features

- Add existing native files ignore option for entitlements evaluation. ([#23165](https://github.com/expo/expo/pull/23165) by [@byCedric](https://github.com/byCedric))

## 7.2.3 - 2023-06-29

_This version does not introduce any user-facing changes._

## 7.2.2 — 2023-06-27

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
