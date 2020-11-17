# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Added `Constants.executionEnvironment` to distinguish between apps running in a bare, managed standalone, or App/Play Store development client environment. ([#10986](https://github.com/expo/expo/pull/10986) by [@esamelson](https://github.com/esamelson))
- Added script to embed app configuration into a bare app and export this object as `Constants.manifest`. ([#10948](https://github.com/expo/expo/pull/10948) and [#10949](https://github.com/expo/expo/pull/10949) by [@esamelson](https://github.com/esamelson))
- If `manifest` is defined on `expo-updates` then use it instead of `ExponentConstants.manifest` ([#10668](https://github.com/expo/expo/pull/10668) by [@esamelson](https://github.com/esamelson))
- Warn when developer attempts to access empty `Constants.manifest` in bare. Throw error when it is empty in managed. ([#11028](https://github.com/expo/expo/pull/11028) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

## 9.2.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 9.1.1 — 2020-05-28

*This version does not introduce any user-facing changes.*

## 9.1.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `uuid`'s deprecation of deep requiring ([#8114](https://github.com/expo/expo/pull/8114) by [@actuallymentor](https://github.com/actuallymentor))
