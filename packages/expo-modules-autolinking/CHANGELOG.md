# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.2.0 — 2023-04-13

### 🎉 New features

- Added Gradle plugin autolinking support for Android. ([#21377](https://github.com/expo/expo/pull/21377) by [@kudo](https://github.com/kudo))

## 1.1.2 — 2023-02-14

### 💡 Others

- Suppress node warnings about deprecated exports mapping in 3rd-party dependencies. ([#21222](https://github.com/expo/expo/pull/21222) by [@tsapeta](https://github.com/tsapeta))

## 1.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 1.1.0 — 2023-02-03

_This version does not introduce any user-facing changes._

## 1.0.2 — 2023-01-10

### 🐛 Bug fixes

- Replace deprecated `File.exists?` with `File.exist?` to fix usage with `ruby@3.2`. ([#20470](https://github.com/expo/expo/pull/20757) by [@KiwiKilian](https://github.com/kiwikilian))

## 1.0.1 — 2022-12-30

### 🐛 Bug fixes

- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))

## 1.0.0 — 2022-11-03

_This version does not introduce any user-facing changes._

## 0.12.0 — 2022-10-25

### 🎉 New features

- Automatically use modular headers for pod dependencies when the package has Swift modules to link. ([#19443](https://github.com/expo/expo/pull/19443) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Bump `@tsconfig/node` to match other Expo Modules packages development setup. ([#19671](https://github.com/expo/expo/pull/19671) by [@Simek](https://github.com/Simek))

## 0.11.0 — 2022-10-06

### 🎉 New features

- Added `includeTests` option to `use_expo_modules!` to include test specs from autolinked modules. ([#18496](https://github.com/expo/expo/pull/18496) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed node executable resolution errors on iOS when `pod install` is executed from package.json `scripts`. ([#18580](https://github.com/expo/expo/pull/18580) by [@kudo](https://github.com/kudo))

## 0.10.1 — 2022-07-25

### 🎉 New features

- Added a feature to automatically generate `.xcode.env.local` with correct `$NODE_BINARY` path when running `pod install`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

## 0.10.0 — 2022-07-07

### 🐛 Bug fixes

- Added support for React Native 0.69.x ([#17629](https://github.com/expo/expo/pull/17629) by [@kudo](https://github.com/kudo))
- Use regex to match ignored modules in `expo_patch_react_imports!` and fix iOS build errors when the project is inside `react-native` named folder. ([#17968](https://github.com/expo/expo/pull/17968) by [@dmnkgrc](https://github.com/dmnkgrc))

## 0.9.0 — 2022-06-23

### 🎉 New features

- The `searchPaths` and `nativeModulesDir` options now support direct paths to specific module directories. ([#17922](https://github.com/expo/expo/pull/17922) by [@barthap](https://github.com/barthap))

## 0.8.1 — 2022-05-12

### 🐛 Bug fixes

- Fixed an infinite loop when the **package.json** is placed at the root path. ([#17440](https://github.com/expo/expo/pull/17440) by [@tsapeta](https://github.com/tsapeta))

## 0.8.0 — 2022-05-06

### 🎉 New features

- Add `ios.debugOnly` to module config. ([#17331](https://github.com/expo/expo/pull/17331) by [@lukmccall](https://github.com/lukmccall))
- Setting `EXPO_CONFIGURATION_DEBUG` or `EXPO_CONFIGURATION_RELEASE` Swift flags on project targets. ([#17378](https://github.com/expo/expo/pull/17378) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix debug-only modules weren't installed if the `DEBUG` flag wasn't present in `OTHER_SWIFT_FLAGS`. ([#17383](https://github.com/expo/expo/pull/17383) by [@lukmccall](https://github.com/lukmccall))
- Fix iOS build if project config name is other than RELEASE or DEBUG ([#17439](https://github.com/expo/expo/pull/17439) by [@uloco](https://github.com/uloco))

### 💡 Others

## 0.7.0 — 2022-04-18

- Update require logic to find transitive deps that would not be hoisted at the top of the monorepo ([#16419](https://github.com/expo/expo/pull/16419) by [@Titozzz](https://github.com/Titozzz))
- Fix `cannot cast object 'ExpoAutolinkingManager@' with class 'ExpoAutolinkingManager' to class 'ExpoAutolinkingManager'` on Android when a project is using `buildSrc`. ([#16545](https://github.com/expo/expo/pull/16545) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Add `ios.swiftModuleName` to module config. ([#16260](https://github.com/expo/expo/pull/16260) by [@esamelson](https://github.com/esamelson))
- Added support for linking multiple podspecs and Gradle projects in a package. ([#16511](https://github.com/expo/expo/pull/16511) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed `expo_patch_react_imports!` not work when the app project is in a folder with spaces. ([#16794](https://github.com/expo/expo/pull/16794) by [@Kudo](https://github.com/Kudo))

## 0.6.0 — 2022-01-26

### ⚠️ Notices

- Expose `findModulesAsync` from `expo-modules-autolinking/build/autolinking` again. ([#15950](https://github.com/expo/expo/pull/15950) by [@EvanBacon](https://github.com/EvanBacon))
- Deprecated `modulesClassNames` in favor of `modules` in the Expo module config. ([#15852](https://github.com/expo/expo/pull/15852) by [@tsapeta](https://github.com/tsapeta))

## 0.5.5 — 2022-01-05

### 🐛 Bug fixes

- Fix `umbrella directory '../../Public/React-Core/React' not found` build error when in `use_frameworks!` mode. ([#15773](https://github.com/expo/expo/pull/15773) by [@kudo](https://github.com/kudo))

## 0.5.4 — 2021-12-29

### 🐛 Bug fixes

- Add `expo_patch_react_imports!` support for React-Native 0.66. ([#15724](https://github.com/expo/expo/pull/15724) by [@kudo](https://github.com/kudo))

## 0.5.3 — 2021-12-28

### 🐛 Bug fixes

- Fix `expo_patch_react_imports!` error when there are pods with absolute path. ([#15699](https://github.com/expo/expo/pull/15699) by [@kudo](https://github.com/kudo))

## 0.5.2 — 2021-12-22

### 🐛 Bug fixes

- Introduce `expo_patch_react_imports!` to transform double-quoted React imports into angle-brackets in order to fix third-party libraries incompatibility with SDK 44. ([#15655](https://github.com/expo/expo/pull/15655) by [@kudo](https://github.com/kudo))

## 0.5.1 — 2021-12-15

_This version does not introduce any user-facing changes._

## 0.5.0 — 2021-12-03

### 🎉 New features

- Patch React podspecs on the fly to support Swift integration. ([#15299](https://github.com/expo/expo/pull/15299) by [@kudo](https://github.com/kudo))
- Add `nativeModulesDir` option to specify app's custom native modules location. ([#15415](https://github.com/expo/expo/pull/15415) by [@barthap](https://github.com/barthap))

## 0.4.0 — 2021-11-17

### 🎉 New features

- Added "silent" property for silencing resolution warnings. ([#14891](https://github.com/expo/expo/pull/14891) by [@EvanBacon](https://github.com/EvanBacon))
- Listing module's app delegate subscribers in the generated `ExpoModulesProvider.swift`. ([#14867](https://github.com/expo/expo/pull/14867) by [@tsapeta](https://github.com/tsapeta))
- Search for Android package in the entire source code other than just `src` directory. ([#14883](https://github.com/expo/expo/pull/14883) by [@kudo](https://github.com/kudo))
- Introduce React Native bridge delegate handlers on iOS. ([#15138](https://github.com/expo/expo/pull/15138) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix Gradle error when running Gradle from outside of the project directory. ([#15109](https://github.com/expo/expo/pull/15109) by [@kudo](https://github.com/kudo))

## 0.3.3 — 2021-10-21

### 🐛 Bug fixes

- Resolved race condition when generating `ExpoModulesProvider.swift`. ([#14822](https://github.com/expo/expo/pull/14822) by [@awinograd](https://github.com/awinograd))
