# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 45.0.6 — 2022-06-23

_This version does not introduce any user-facing changes._

## 45.0.4 — 2022-05-12

_This version does not introduce any user-facing changes._

## 45.0.3 — 2022-05-11

### 📚 3rd party library updates

- Update react-native dependency to 0.68.2. ([#17438](https://github.com/expo/expo/pull/17438) by [@kudo](https://github.com/kudo))

## 45.0.2 — 2022-05-09

_This version does not introduce any user-facing changes._

## 45.0.1 — 2022-05-06

_This version does not introduce any user-facing changes._

## 45.0.0 — 2022-05-05

### 🐛 Bug fixes

- Fixed `Unable to deactivate keep awake. However, it probably is deactivated already` unhandled promise rejection warning when resuming apps on Android. ([#17319](https://github.com/expo/expo/pull/17319) by [@kudo](https://github.com/kudo))

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
