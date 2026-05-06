# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 2.2.0 — 2026-05-05

_This version does not introduce any user-facing changes._

## 2.1.2 - 2026-05-05

_This version does not introduce any user-facing changes._

## 2.1.1 — 2026-02-16

### 🐛 Bug fixes

- Fix env variables from system env being returned instead of sourced value from files ([#43037](https://github.com/expo/expo/pull/43037) by [@kitten](https://github.com/kitten))

## 2.1.0 — 2026-02-08

### 🎉 New features

- Switch to `node:util`'s `parseEnv` and preserve previous `dotenv-expand` logic ([#42763](https://github.com/expo/expo/pull/42763) by [@kitten](https://github.com/kitten))

## 2.0.11 — 2026-01-26

_This version does not introduce any user-facing changes._

## 2.0.10 — 2026-01-22

_This version does not introduce any user-facing changes._

## 2.0.9 — 2026-01-21

_This version does not introduce any user-facing changes._

## 2.0.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 2.0.7 — 2025-09-10

_This version does not introduce any user-facing changes._

## 2.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 2.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 2.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 2.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 2.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 2.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 2.0.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 1.0.7 - 2025-07-03

_This version does not introduce any user-facing changes._

## 1.0.6 - 2025-07-01

### 🐛 Bug fixes

- Update to `getenv@2.0.0` to support upper case boolean environment variables ([#36688](https://github.com/expo/expo/pull/36688) by [@stephenlacy](https://github.com/stephenlacy))

## 1.0.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 1.0.4 — 2025-04-25

_This version does not introduce any user-facing changes._

## 1.0.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 1.0.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 1.0.1 — 2025-04-08

_This version does not introduce any user-facing changes._

## 1.0.0 — 2025-01-08

### 🛠 Breaking changes

- Break up the API into more modular methods to get environment variables without applying them and remove the package state. ([#33633](https://github.com/expo/expo/pull/33633) by [@byCedric](https://github.com/byCedric))

## 0.4.0 — 2024-10-22

_This version does not introduce any user-facing changes._

## 0.3.0 — 2024-04-18

### 🐛 Bug fixes

- Upgrade `dotenv-expand` to avoid recursive expansion loops. ([#27764](https://github.com/expo/expo/pull/27764) by [@byCedric](https://github.com/byCedric))

## 0.2.2 - 2024-03-07

### 💡 Others

- Warn instead of error when `NODE_ENV` is set to non-conventional value. ([#27111](https://github.com/expo/expo/pull/27111) by [@byCedric](https://github.com/byCedric))

## 0.2.1 — 2023-12-15

_This version does not introduce any user-facing changes._

## 0.2.0 — 2023-12-12

### 🐛 Bug fixes

- Avoid unnecessary `process.env` modifications for consistent Node and Bun results. ([#25393](https://github.com/expo/expo/pull/25393) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25418](https://github.com/expo/expo/pull/25418) by [@byCedric](https://github.com/byCedric))

## 0.1.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 0.0.5 - 2023-06-30

### 🎉 New features

- Log env info when loading variables from dotenv files. ([#23215](https://github.com/expo/expo/pull/23215) by [@EvanBacon](https://github.com/EvanBacon))

## 0.0.4 - 2023-06-29

### 🎉 New features

- Add ability to fully disable dotenv loading with `EXPO_NO_DOTENV` environment variable. ([#23169](https://github.com/expo/expo/pull/23169) by [@EvanBacon](https://github.com/EvanBacon))

## 0.0.3 — 2023-05-08

### 🐛 Bug fixes

- Default to running in `development` mode when no `NODE_ENV` is specified. ([#22121](https://github.com/expo/expo/pull/22121) by [@EvanBacon](https://github.com/EvanBacon))
