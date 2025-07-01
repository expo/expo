# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.12.7 - 2025-07-01

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 0.12.6 — 2025-05-06

_This version does not introduce any user-facing changes._

## 0.12.5 — 2025-05-01

_This version does not introduce any user-facing changes._

## 0.12.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.12.3 — 2025-04-28

### 💡 Others

- Updated `AppDelegate.swift` change for SDK 53. ([#36445](https://github.com/expo/expo/pull/36445) by [@kudo](https://github.com/kudo))

## 0.12.2 — 2025-04-28

_This version does not introduce any user-facing changes._

## 0.12.1 — 2025-04-25

_This version does not introduce any user-facing changes._

## 0.12.0 — 2025-04-21

### 🎉 New features

- Added react-native 0.77 support. ([#36204](https://github.com/expo/expo/pull/36204) by [@kudo](https://github.com/kudo))
- Added react-native 0.78 support. ([#36205](https://github.com/expo/expo/pull/36205) by [@kudo](https://github.com/kudo))
- Added react-native 0.79 support. ([#36206](https://github.com/expo/expo/pull/36206) by [@kudo](https://github.com/kudo))

## 0.11.8 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.11.7 — 2025-04-08

_This version does not introduce any user-facing changes._

## 0.11.6 - 2025-03-31

_This version does not introduce any user-facing changes._

## 0.11.5 - 2025-02-14

_This version does not introduce any user-facing changes._

## 0.11.4 - 2025-01-10

_This version does not introduce any user-facing changes._

## 0.11.3 - 2025-01-08

_This version does not introduce any user-facing changes._

## 0.11.2 — 2024-11-20

_This version does not introduce any user-facing changes._

## 0.11.1 — 2024-11-14

_This version does not introduce any user-facing changes._

## 0.11.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added support for Babel config files other than `babel.config.js` when upgrading plain React Native project. ([#30356](https://github.com/expo/expo/pull/30356) by [@wojtekmaj](https://github.com/wojtekmaj))
- Added react-native 0.76 support. ([#32141](https://github.com/expo/expo/pull/32141) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- [iOS] Fixed "Unsupported Swift Version" when running `install-expo-modules` on a RNC CLI project. ([#30414](https://github.com/expo/expo/pull/30414) by [@vonovak](https://github.com/vonovak))
- Fixed crash when `babel.config.js` was not found when upgrading plain React Native project. ([#30356](https://github.com/expo/expo/pull/30356) by [@wojtekmaj](https://github.com/wojtekmaj))

### 💡 Others

- Update `commander` dependency. ([#29603](https://github.com/expo/expo/pull/29603) by [@Simek](https://github.com/Simek))
- Update `glob@7` to `glob@10`. ([#29933](https://github.com/expo/expo/pull/29933) by [@byCedric](https://github.com/byCedric))
- Fixed the `missing required argument 'project-directory'` error when executing without specifying a project directory. ([#32054](https://github.com/expo/expo/pull/32054) by [@kudo](https://github.com/kudo))

## 0.10.2 - 2024-06-28

_This version does not introduce any user-facing changes._

## 0.10.1 - 2024-05-29

_This version does not introduce any user-facing changes._

## 0.10.0 — 2024-04-25

### 🎉 New features

- Added Expo SDK 51 and React Native 0.74 support. ([#28444](https://github.com/expo/expo/pull/28444) by [@kudo](https://github.com/kudo))

## 0.9.1 — 2024-04-24

_This version does not introduce any user-facing changes._

## 0.9.0 — 2024-04-18

### 🐛 Bug fixes

- Fixed vulnerability with update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 0.8.1 - 2024-01-10

### 🐛 Bug fixes

- Avoid installing dependencies when running `npx install-expo-modules`. ([#26075](https://github.com/expo/expo/pull/26075) by [@byCedric](https://github.com/byCedric))
- Fixed the unknown syntax error when running on a Yarn v3 project. ([#26123](https://github.com/expo/expo/pull/26123) by [@kudo](https://github.com/kudo))

## 0.8.0 — 2023-12-14

### 🎉 New features

- Added Expo SDK 50 and React Native 0.73 support. ([#25907](https://github.com/expo/expo/pull/25907) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed the unclear `ENOENT: no such file or directory` error when running on a CNG project. ([#25913](https://github.com/expo/expo/pull/25913) by [@kudo](https://github.com/kudo))

## 0.7.0 — 2023-12-12

### 💡 Others

- Move package from `expo/expo-cli` to `expo/expo`. ([#25533](https://github.com/expo/expo/pull/25533) by [@byCedric](https://github.com/byCedric))
- Updated `@expo/config` from `~8.0.0` to `^8.4.0`. ([#25533](https://github.com/expo/expo/pull/25533) by [@byCedric](https://github.com/byCedric))
- Updated `@expo/config-plugins` from `~6.0.0` to `^7.7.0`. ([#25533](https://github.com/expo/expo/pull/25533) by [@byCedric](https://github.com/byCedric))
- Updated `@expo/package-manager` from `0.0.56` to `^1.0.3`. ([#25533](https://github.com/expo/expo/pull/25533) by [@byCedric](https://github.com/byCedric))
