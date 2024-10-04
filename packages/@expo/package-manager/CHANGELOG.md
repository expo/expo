# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Add missing `ora` dependency. ([#26023](https://github.com/expo/expo/pull/26023) by [@byCedric](https://github.com/byCedric))

### 💡 Others

## 1.4.0 — 2023-12-12

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25422](https://github.com/expo/expo/pull/25422) by [@byCedric](https://github.com/byCedric))

## 1.3.0 — 2023-10-17

### 🐛 Bug fixes

- Detect bun before yarn to allow bun install --yarn usage. ([#24360](https://github.com/expo/expo/pull/24360) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.2 — 2023-09-25

### 🐛 Bug fixes

- Detect bun before yarn to allow bun install --yarn usage. ([#24360](https://github.com/expo/expo/pull/24360) by [@byCedric](https://github.com/byCedric))

## 1.2.0 — 2023-09-15

### 🎉 New features

- Add support for [Bun](https://bun.sh) package manager. ([#24168](https://github.com/expo/expo/pull/24168) by [@colinhacks](https://github.com/colinhacks))

### 🐛 Bug fixes

- Fix build files. ([#24344](https://github.com/expo/expo/pull/24344) by [@EvanBacon](https://github.com/EvanBacon))
- Remove console log. ([#24355](https://github.com/expo/expo/pull/24355) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.1 — 2023-09-11

### 🐛 Bug fixes

- Remove console log. ([#24355](https://github.com/expo/expo/pull/24355) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.0 — 2023-09-11

### 🎉 New features

- Add support for [Bun](https://bun.sh) package manager by [@colinhacks][https://github.com/colinhacks] ([#24168](https://github.com/expo/expo/pull/24168) by [@colinhacks](https://github.com/colinhacks))

### 💡 Others

## 1.0.3 — 2023-09-04

_This version does not introduce any user-facing changes._

## 1.0.2 — 2023-05-08

_This version does not introduce any user-facing changes._

## 1.0.0 — 2023-02-15

_This version does not introduce any user-facing changes._

## 0.0.59 — 2023-02-14

### 🛠 Breaking changes

- Refactor the Node package manager API to support specific installation functionality and improve workspace usage. ([#18576](https://github.com/expo/expo/pull/18576) by [@byCedric](https://github.com/byCedric))

### 🐛 Bug fixes

- Validate if pnpm workspace is part of monorepo. ([#19342](https://github.com/expo/expo/pull/19342) by [@byCedric](https://github.com/byCedric))
- Present error output to users when not using silent mode. ([#19340](https://github.com/expo/expo/pull/19340) by [@byCedric](https://github.com/byCedric))
- Disable pnpm frozen lockfiles in CI for prebuild. ([#19341](https://github.com/expo/expo/pull/19341) by [@byCedric](https://github.com/byCedric))
- Install dist-tag referred dependencies normally as unversioned dependency ([#21189][https://github.com/expo/expo/pull/21189] by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Drop rimraf in favor of native fs API. ([#19764](https://github.com/expo/expo/pull/19764) by [@byCedric](https://github.com/byCedric))

## 0.0.58 — 2023-02-03

### 💡 Others

- Bump `@expo/json-file`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
