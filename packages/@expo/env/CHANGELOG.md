# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed `.load(_, { strict: true })`. As expected, now it overwrites env variables after second call. ([#28935](https://github.com/expo/expo/pull/28935) by [@XantreDev](https://github.com/XantreDev))

### 💡 Others

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
