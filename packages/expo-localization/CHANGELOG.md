# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Add `currency`, `isMetric`, `decimalSeparator`, `digitGroupingSeparator` properties. ([#11663](https://github.com/expo/expo/pull/11663) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add support for `region` property for Android. ([#11663](https://github.com/expo/expo/pull/11663) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🐛 Bug fixes

- Fix invalid `region` property on Web when locale contains script or variant fields. ([#11663](https://github.com/expo/expo/pull/11663) by [@IjzerenHein](https://github.com/IjzerenHein))
- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- `Localization.region` changed from `undefined | string` to `null | string` on web to match iOS. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added doc blocks for everything. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for SSR environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- `Localization.isRTL` defaults to `false` in node environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- `Localization.region` now returns `null` when a partial `locale` is defined by the browser on web. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `Localization.locale` throwing an exception on the iOS simulator. ([#8193](https://github.com/expo/expo/pull/8193) by [@lukmccall](https://github.com/lukmccall))
