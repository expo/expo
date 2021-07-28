# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 6.3.5 — 2021-07-28

_This version does not introduce any user-facing changes._

## 6.3.4 — 2021-07-09

### 🐛 Bug fixes

- Changed generateExpoModulesPackageList for preBuild.dependsOn with quotes in build.gradle. ([#13568](https://github.com/expo/expo/pull/13568) by [@wbroek](https://github.com/wbroek))

## 6.3.3 — 2021-07-08

_This version does not introduce any user-facing changes._

## 6.3.2 — 2021-07-06

### 🐛 Bug fixes

- Escape Android autolinking script for Windows. ([#13494](https://github.com/expo/expo/pull/13494) by [@byCedric](https://github.com/byCedric))

## 6.3.1 — 2021-06-22

_This version does not introduce any user-facing changes._

## 6.3.0 — 2021-05-25

- Include missing `UMPermissionsInterface` dependency in the podspec. ([#12862](https://github.com/expo/expo/pull/12862) by [@budiTjendra](https://github.com/budiTjendra))

### 🎉 New features

- Added CocoaPods & Gradle scripts to use new autolinking implementation (opt-in feature). ([#11593](https://github.com/expo/expo/pull/11593) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 6.2.2 — 2021-04-13

### 🎉 New features

- Removed `lodash` ([#12507](https://github.com/expo/expo/pull/12507) by [@EvanBacon](https://github.com/EvanBacon))

## 6.2.1 — 2021-03-30

_This version does not introduce any user-facing changes._

## 6.2.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 6.1.0 — 2021-01-15

### 🎉 New features

- Added `Platform.canUseEventListeners` and `Platform.canUseViewport` methods. ([#11398](https://github.com/expo/expo/pull/11398) by [@cruzach](https://github.com/cruzach))

## 6.0.0 — 2020-12-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 5.7.0 — 2020-11-17

### 🐛 Bug fixes

- Fixed invalid numbers of listeners being considered unregistered on iOS, resulting in _Attempted to remove more '{ModuleName}' listeners than added._ errors. ([#10771](https://github.com/expo/expo/pull/10771) by [@sjchmiela](https://github.com/sjchmiela))

## 5.6.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 5.5.0 — 2020-08-11

### 🛠 Breaking changes

- Deprecate `RCTDeviceEventEmitter` in favor of the renamed `DeviceEventEmitter`. ([#8826](https://github.com/expo/expo/pull/8826) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Remove `prop-types` ([#8681](https://github.com/expo/expo/pull/8681) by [@EvanBacon](https://github.com/EvanBacon))
- Add `Platform.isDOMAvailable` to detect web browser environments. ([#8645](https://github.com/expo/expo/pull/8645) by [@EvanBacon](https://github.com/EvanBacon))
- Add `Platform.select()` method to switch values between platforms. ([#8645](https://github.com/expo/expo/pull/8645) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade to `react-native-web@~0.12`. ([#9023](https://github.com/expo/expo/pull/9023) by [@EvanBacon](https://github.com/EvanBacon))

## 5.4.0 — 2020-05-29

### 🐛 Bug fixes

- Made it possible for SSR (node) environments that don't bundle using platform extensions to work without resolving native code. ([#8502](https://github.com/expo/expo/pull/8502) by [@EvanBacon](https://github.com/EvanBacon))

## 5.3.0 — 2020-05-27

_This version does not introduce any user-facing changes._
