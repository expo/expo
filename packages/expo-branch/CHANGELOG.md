# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 4.2.1 — 2021-06-24

_This version does not introduce any user-facing changes._

## 4.2.0 — 2021-06-16

### 🎉 New features

- [plugin] Refactor imports ([#13029](https://github.com/expo/expo/pull/13029) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 4.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugin. ([#11623](https://github.com/expo/expo/pull/11623) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- remove ts-ignore from plugin. ([#11633](https://github.com/expo/expo/pull/11633) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.0 — 2020-11-17

### 🛠 Breaking changes

- On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))

## 2.3.1 — 2020-09-16

### 🎉 New features

- Updated `react-native-branch` vendored code to 5.0.0, upgraded underlying Branch SDKs, see [`react-native-branch`'s changelog](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution/blob/master/ChangeLog.md) for full list of changes. ([#10204](https://github.com/expo/expo/pull/10204) by [@sjchmiela](https://github.com/sjchmiela))

## 2.3.0 — 2020-08-18

### 🎉 New features

- Updated `react-native-branch` vendored code to 5.0.0-rc.1, upgraded underlying Branch SDKs, see [`react-native-branch`'s changelog](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution/blob/master/ChangeLog.md) for full list of changes. ([#9625](https://github.com/expo/expo/pull/9625) by [@sjchmiela](https://github.com/sjchmiela))

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
