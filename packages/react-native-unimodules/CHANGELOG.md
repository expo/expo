# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 0.10.1 — 2020-05-29

### 📚 Library updates

- Updated dependencies to match versions included in Expo SDK38.

## 0.9.0

### 📚 Library updates

- Updated `@unimodules/react-native-adapter` to version `5.2.0`.

## 0.8.1

### 🎉 New features

- Added `unimodules-app-loader` to dependencies.

## 0.8.0

### 🛠 Breaking changes

- Updated core packages, please refer to [their changelogs](https://github.com/expo/expo/blob/master/CHANGELOG.md) to see the diff.
- Removed `expo-app-loader-provider` from dependencies.

### 🎉 New features

- Added `expo-image-loader` to dependencies.

### 🐛 Bug fixes

- Fix `pod install --deployment` failing due to pathname object being used instead of a string. ([#96](https://github.com/unimodules/react-native-unimodules/pull/96) by [@tsapeta](https://github.com/tsapeta))

## 0.7.0

### 📚 Library updates

- Updated `@unimodules/react-native-adapter` to version `5.0.0`.

### 🛠 Breaking changes

- Updated core packages, please refer to [their changelogs](https://github.com/expo/expo/blob/master/CHANGELOG.md) to see the diff.

### 🎉 New features

- Allow passing custom pod flags to the unimodules.

## 0.6.0

### 🛠 Breaking changes

- Updated core packages, please refer to [their changelogs](https://github.com/expo/expo/blob/master/CHANGELOG.md) to see the diff.

## 0.5.3

## 0.5.2

### 🐛 Bug fixes

- Updated `@unimodules/core` to version `3.0.2` including proper ProGuard rules.

## 0.5.0

### 🛠 Breaking changes

- Updated core packages, please refer to [their changelogs](https://github.com/expo/expo/blob/master/CHANGELOG.md) to see the diff

## 0.4.2

### 🐛 Bug fixes

- Fixed MainApplication.kt not being recognized correctly. ([#46](https://github.com/unimodules/react-native-unimodules/pull/46) by [@geovannimp](https://github.com/geovannimp))

## 0.4.1

### 🐛 Bug fixes

- Added support for Kotlin ([#39](https://github.com/unimodules/react-native-unimodules/pull/39) by [@bbarthec](https://github.com/bbarthec))

## 0.4.0

### 🛠 Breaking changes

- Updated core packages, please refer to [their changelogs](https://github.com/expo/expo/blob/master/CHANGELOG.md) to see the diff

### 🐛 Bug fixes

- Support version tags when adding dependencies for unimodules

## 0.3.1

### 🐛 Bug fixes

- Fixed TypeScript definitions of common unimodules not being exported. Thanks [@saadq](https://github.com/saadq)! ([#24](https://github.com/unimodules/react-native-unimodules/pull/24))
- Fixed automatic installation script not finding unimodules when using CocoaPods' `--project-directory` flag. ([#31](https://github.com/unimodules/react-native-unimodules/pull/31))

## 0.3.0

### 🎉 New features

- Automatically generated list of Android packages ([#28](https://github.com/unimodules/react-native-unimodules/pull/28))
As of this version, you no longer need to add new packages to your `MainApplication.java` file. Just use `new BasePackageList().getPackageList()` instead 🎉. `BasePackageList` is auto-generated with a list of installed unimodules found in your `node_modules` folder during Gradle's Sync operation.
