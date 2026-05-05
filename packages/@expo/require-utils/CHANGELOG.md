# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add `resolveFrom` utility that supports custom extensions and not following symlinks ([#44114](https://github.com/expo/expo/pull/44114) by [@kitten](https://github.com/kitten))
- Add `resolveGlobal` utility for sharp and ngrok resolution ([#44236](https://github.com/expo/expo/pull/44236) by [@kitten](https://github.com/kitten))
- Add option to `resolveFrom` to skip `NODE_PATH` resolution ([#45164](https://github.com/expo/expo/pull/45164) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

- Prevent `.js` transform from discovering project Babel config ([#43726](https://github.com/expo/expo/pull/43726) by [@kitten](https://github.com/kitten))
- Resolve realpath for evaluated modules' `node_modules` paths in `compileModule` ([#44599](https://github.com/expo/expo/pull/44599) by [@kitten](https://github.com/kitten))

### 💡 Others

## 55.0.2 — 2026-02-25

### 🐛 Bug fixes

- Fix ESM/CJS compatibility errors being swallowed ([#43329](https://github.com/expo/expo/pull/43329) by [@kitten](https://github.com/kitten))
- Restore old ESM-to-CJS transform behaviour for `.js` and `.ts` loading for now ([#43329](https://github.com/expo/expo/pull/43329) by [@kitten](https://github.com/kitten))

## 55.0.1 — 2026-02-20

### 🐛 Bug fixes

- Support CommonJS syntax in `.ts` evaluated files ([#43243](https://github.com/expo/expo/pull/43242))

## 55.0.0 — 2026-02-16

_This version does not introduce any user-facing changes._
