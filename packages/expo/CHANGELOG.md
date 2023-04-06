# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

### 📚 3rd party library updates

- Update `react-native` to 0.69.9. ([#21981](https://github.com/expo/expo/pull/21981) by [@kudo](https://github.com/kudo))

## 46.0.20 — 2023-01-19

_This version does not introduce any user-facing changes._

## 46.0.19 — 2022-12-21

_This version does not introduce any user-facing changes._

## 46.0.18 — 2022-12-21

_This version does not introduce any user-facing changes._

## 46.0.17 — 2022-11-09

_This version does not introduce any user-facing changes._

## 46.0.16 — 2022-10-13

_This version does not introduce any user-facing changes._

## 46.0.15 — 2022-10-06

_This version does not introduce any user-facing changes._

## 46.0.14 — 2022-10-02

_This version does not introduce any user-facing changes._

## 46.0.13 — 2022-09-26

_This version does not introduce any user-facing changes._

## 46.0.12 — 2022-09-26

_This version does not introduce any user-facing changes._

## 46.0.11 — 2022-09-26

_This version does not introduce any user-facing changes._

## 46.0.10 — 2022-09-01

_This version does not introduce any user-facing changes._

## 46.0.9 — 2022-08-22

_This version does not introduce any user-facing changes._

## 46.0.8 — 2022-08-18

### 🐛 Bug fixes

- Fixed `FabricUIManager` errors when turning on new architecture mode on Android. ([#18472](https://github.com/expo/expo/pull/18472) by [@kudo](https://github.com/kudo))

## 46.0.7 — 2022-08-13

_This version does not introduce any user-facing changes._

## 46.0.6 — 2022-08-12

_This version does not introduce any user-facing changes._

## 46.0.5 — 2022-08-12

_This version does not introduce any user-facing changes._

## 46.0.4 — 2022-08-12

_This version does not introduce any user-facing changes._

## 46.0.3 — 2022-08-10

_This version does not introduce any user-facing changes._

## 46.0.2 — 2022-07-29

_This version does not introduce any user-facing changes._

## 46.0.1 — 2022-07-25

_This version does not introduce any user-facing changes._

## 46.0.0 — 2022-07-25

_This version does not introduce any user-facing changes._

## 46.0.0-beta.7 — 2022-07-25

### 🎉 New features

- Added a feature to automatically generate `.xcode.env.local` with correct `$NODE_BINARY` path when running `pod install`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

## 46.0.0-beta.6 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.5 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.4 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.3 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.2 — 2022-07-18

_This version does not introduce any user-facing changes._

## 46.0.0-beta.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.3 — 2022-07-11

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.2 — 2022-07-08

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.1 — 2022-07-08

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.0 — 2022-07-07

### 🎉 New features

- Added web support and bundle splitting support to `DevLoadingView`. ([#17714](https://github.com/expo/expo/pull/17714) by [@EvanBacon](https://github.com/EvanBacon))
- Add `ExpoErrorManager` to improve some commonly logged error messages. ([#18064](https://github.com/expo/expo/pull/18064) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- On Android fixed `onActivityResult` not being propagated by `ReactDelegate` when Android decides to kill and then recreate application `Activity` when low on resources. ([#17572](https://github.com/expo/expo/pull/17572)) by [@bbarthec](https://github.com/bbarthec))
- Fixed `Unable to deactivate keep awake. However, it probably is deactivated already` unhandled promise rejection warning when resuming apps on Android. ([#17319](https://github.com/expo/expo/pull/17319) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.69.x ([#17629](https://github.com/expo/expo/pull/17629) and [#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- Update react-native dependency to 0.68.2. ([#17438](https://github.com/expo/expo/pull/17438) by [@kudo](https://github.com/kudo))

## 45.0.0-beta.9 — 2022-04-28

_This version does not introduce any user-facing changes._

## 45.0.0-beta.8 — 2022-04-27

_This version does not introduce any user-facing changes._

## 45.0.0-beta.7 — 2022-04-27

### 🐛 Bug fixes

- Forward CLI exit code to process. ([#17189](https://github.com/expo/expo/pull/17189) by [@EvanBacon](https://github.com/EvanBacon))

## 45.0.0-beta.6 — 2022-04-27

_This version does not introduce any user-facing changes._

## 45.0.0-beta.5 — 2022-04-25

### 🐛 Bug fixes

- Fix `Overwriting fontFamily style attribute preprocessor` warning when startup. ([#17138](https://github.com/expo/expo/pull/17138) by [@Kudo](https://github.com/Kudo))

## 45.0.0-beta.4 — 2022-04-21

_This version does not introduce any user-facing changes._

## 45.0.0-beta.3 — 2022-04-21

_This version does not introduce any user-facing changes._

## 45.0.0-beta.2 — 2022-04-20

### 🎉 New features

- Add `ReactNativeHostHandler.getUseDeveloperSupport()` to allow `expo-dev-launcher` to override this value at runtime. ([#17069](https://github.com/expo/expo/pull/17069) by [@esamelson](https://github.com/esamelson))

## 45.0.0-beta.1 — 2022-04-18

### 🎉 New features

- Add `EXPO_USE_BETA_CLI` to utilize the new `@expo/cli` versioned package. ([#17007](https://github.com/expo/expo/pull/17007) by [@EvanBacon](https://github.com/EvanBacon))
- Added Android `ReactNativeHostHandler.getJavaScriptExecutorFactory()` for a module to override the `JavaScriptExecutorFactory`. ([#17005](https://github.com/expo/expo/pull/17005) by [@kudo](https://github.com/kudo))
- Add `react`, `react-native`, `react-dom`, and `react-native-web` to `bundledNativeModules.json`. ([#17048](https://github.com/expo/expo/pull/17048) by [@EvanBacon](https://github.com/EvanBacon))
