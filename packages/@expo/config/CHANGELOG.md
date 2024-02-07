# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

### 📚 3rd party library updates

- update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 8.5.4 - 2024-01-18

### 🐛 Bug fixes

- Pin `sucrase@3.34.0` to avoid yarn v1 incompatibilities with `@isaacs/cliui` module aliases ([#26459](https://github.com/expo/expo/pull/26459) by [@byCedric](https://github.com/byCedric))

## 8.5.3 - 2024-01-05

_This version does not introduce any user-facing changes._

## 8.5.2 - 2023-12-19

_This version does not introduce any user-facing changes._

## 8.5.1 — 2023-12-15

_This version does not introduce any user-facing changes._

## 8.5.0 — 2023-12-12

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25416](https://github.com/expo/expo/pull/25416) by [@byCedric](https://github.com/byCedric))

## 8.4.0 — 2023-10-17

- Warn when dynamic config doesn't use static config present in project. ([#24308](https://github.com/expo/expo/pull/24308) by [@keith-kurak](https://github.com/keith-kurak))

### 🛠 Breaking changes

- Remove `getEntryPoint`, `getEntryPointWithExtensions`, `resolveFromSilentWithExtensions` functions from `@expo/config/paths`. ([#24688](https://github.com/expo/expo/pull/24688) by [@EvanBacon](https://github.com/EvanBacon))
- Fully drop support for `expo.entryFile` in the `app.json`. ([#24688](https://github.com/expo/expo/pull/24688) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed the `withAnonymous` config plugins' property name for anonymous raw functions. ([#24363](https://github.com/expo/expo/pull/24363) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite `resolveEntryPoint` from `@expo/config/paths`. ([#21725](https://github.com/expo/expo/pull/21725) by [@EvanBacon](https://github.com/EvanBacon))

## 8.3.1 — 2023-09-15

_This version does not introduce any user-facing changes._

## 8.3.0 — 2023-09-04

### 🛠 Breaking changes

- Remove classic manifest types. ([#24054](https://github.com/expo/expo/pull/24054) by [@wschurman](https://github.com/wschurman))

## 8.2.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 8.2.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 8.1.1 — 2023-06-27

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 8.1.0 — 2023-06-21

_This version does not introduce any user-facing changes._

## 8.0.4 — 2023-05-08

### 🐛 Bug fixes

- Drop `entryPoint` usage. ([#22416](https://github.com/expo/expo/pull/22416) by [@EvanBacon](https://github.com/EvanBacon))

## 8.0.3 — 2023-05-08

### 🐛 Bug fixes

- Make `exp` type optional in `resolveEntryPoint`. ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))

## 8.0.1 — 2023-02-09

### 🛠 Breaking changes

- Remove originalFullName currentFullName hack from exported config. ([#21070](https://github.com/expo/expo/pull/21070) by [@wschurman](https://github.com/wschurman))

## 8.0.0 — 2023-02-03

### 🛠 Breaking changes

- Assert that use of `expo.entryPoint` is not supported (never has been outside of classic builds). ([#20891](https://github.com/expo/expo/pull/20891) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Bump `@expo/json-file`, `@expo/plist`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
