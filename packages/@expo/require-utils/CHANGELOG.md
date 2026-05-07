# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add Node built-in source-map support to `evalModule` ([#45507](https://github.com/expo/expo/pull/45507) by [@kitten](https://github.com/kitten))
- Add `cache` flag to remove retaining modules from `evalModule` ([#45509](https://github.com/expo/expo/pull/45509) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

### 💡 Others

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🎉 New features

- Add option to `resolveFrom` to skip `NODE_PATH` resolution ([#45164](https://github.com/expo/expo/pull/45164) by [@kitten](https://github.com/kitten))

## 55.0.5 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.4 - 2026-04-09

### 🎉 New features

- Add `resolveFrom` utility that supports custom extensions and not following symlinks ([#44114](https://github.com/expo/expo/pull/44114) by [@kitten](https://github.com/kitten))
- Add `resolveGlobal` utility for sharp and ngrok resolution ([#44236](https://github.com/expo/expo/pull/44236) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

- Resolve realpath for evaluated modules' `node_modules` paths in `compileModule` ([#44599](https://github.com/expo/expo/pull/44599) by [@kitten](https://github.com/kitten))

## 55.0.3 - 2026-03-17

### 🐛 Bug fixes

- Prevent `.js` transform from discovering project Babel config ([#43726](https://github.com/expo/expo/pull/43726) by [@kitten](https://github.com/kitten))

## 55.0.2 — 2026-02-25

### 🐛 Bug fixes

- Fix ESM/CJS compatibility errors being swallowed ([#43329](https://github.com/expo/expo/pull/43329) by [@kitten](https://github.com/kitten))
- Restore old ESM-to-CJS transform behaviour for `.js` and `.ts` loading for now ([#43329](https://github.com/expo/expo/pull/43329) by [@kitten](https://github.com/kitten))

## 55.0.1 — 2026-02-20

### 🐛 Bug fixes

- Support CommonJS syntax in `.ts` evaluated files ([#43243](https://github.com/expo/expo/pull/43242))

## 55.0.0 — 2026-02-16

_This version does not introduce any user-facing changes._
