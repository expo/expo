# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.14.7 — 2021-09-07

_This version does not introduce any user-facing changes._

## 0.14.6 — 2021-07-20

_This version does not introduce any user-facing changes._

## 0.14.5 — 2021-07-09

_This version does not introduce any user-facing changes._

## 0.14.4 — 2021-07-08

_This version does not introduce any user-facing changes._

## 0.14.3 — 2021-06-24

_This version does not introduce any user-facing changes._

## 0.14.2 — 2021-06-22

_This version does not introduce any user-facing changes._

## 0.14.1 — 2021-06-16

_This version does not introduce any user-facing changes._

## 0.14.0 — 2021-05-25

### 🐛 Bug fixes

- Remove expo-permissions (again). ([#12900](https://github.com/expo/expo/pull/12900) by [@brentvatne](https://github.com/brentvatne))

### 💡 Others

- Migrated interfaces from their own packages to `expo-modules-core`. ([#12868](https://github.com/expo/expo/pull/12868), [#12876](https://github.com/expo/expo/pull/12876), [#12888](https://github.com/expo/expo/pull/12888), [#12918](https://github.com/expo/expo/pull/12918), [#12949](https://github.com/expo/expo/pull/12949) by [@tsapeta](https://github.com/tsapeta))

## 0.13.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 0.13.2 — 2021-04-09

### 🛠 Breaking changes

- Removed exported `Permissions` object and removed `expo-permissions` from dependencies. ([#12405](https://github.com/unimodules/react-native-unimodules/pull/12405) by [@bbarthec](https://github.com/bbarthec))
  > `expo-permissions` is now deprecated — the functionality has been moved to other expo packages that directly use these permissions (e.g. `expo-location`, `expo-camera`).

### 🎉 New features

- Added `tests` field to options in `use_unimodules` ruby script. ([#11972](https://github.com/expo/expo/pull/11972) by [@esamelson](https://github.com/esamelson))

## 0.13.1 — 2021-03-30

_This version does not introduce any user-facing changes._

## 0.13.0 — 2021-03-10

### 🎉 New features

- Added support for statically configuring linking with `react-native-unimodules` object in the `package.json`. ([#11524](https://github.com/expo/expo/pull/11524) by [@EvanBacon](https://github.com/EvanBacon))

## 0.12.0 — 2020-11-17

### 🐛 Bug fixes

- Fixed resolving Gradle module path when a symlink is provided. ([#10007](https://github.com/expo/expo/pull/10007) by [@barthap](https://github.com/barthap))

## 0.11.0 — 2020-08-18

### 🎉 New features

- Easier to follow installation instructions by moving them to the Expo documentation ([#9145](https://github.com/expo/expo/pull/9145)).

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
