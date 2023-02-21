# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.0.1 — 2023-02-21

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
