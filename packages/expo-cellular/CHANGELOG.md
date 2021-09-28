# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Deprecated module's constants in favor of new methods returning up-to-date data. ([#13729](https://github.com/expo/expo/pull/13729) by [@m1st4ke](https://github.com/m1st4ke))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Added 5G cellular support ([#13713](https://github.com/expo/expo/pull/13713) by [@m1st4ke](https://github.com/m1st4ke))
- Added methods returning up-to-date data. ([#13729](https://github.com/expo/expo/pull/13729) by [@m1st4ke](https://github.com/m1st4ke))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Added experimental opt-in implementation in Swift ([#13523](https://github.com/expo/expo/pull/13523) by [@tsapeta](https://github.com/tsapeta))
- Rewrote Android part from Java to Kotlin ([#13694](https://github.com/expo/expo/pull/13694) by [@m1st4ke](https://github.com/m1st4ke))

## 3.2.0 — 2021-06-16

### 🎉 New features

- [plugin] Created config plugin for applying permissions on Android ([#13175](https://github.com/expo/expo/pull/13175) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix null cellular information on iOS. ([#12710](https://github.com/expo/expo/pull/12710) by [@randomhajile](https://github.com/randomhajile))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Add TypeScript types to the exported constants: `allowsVoip`, `carrier`, `isoCountryCode`, `mobileCountryCode` and `mobileNetworkCode`. ([#12838](https://github.com/expo/expo/pull/12838) by [@simek](https://github.com/simek))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
