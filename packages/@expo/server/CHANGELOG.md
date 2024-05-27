# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fix `ExpoResponse` using incorrect object. ([#29154](https://github.com/expo/expo/pull/29154) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

## 0.4.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 0.4.1 — 2024-04-22

### 🐛 Bug fixes

- Fix 404 when serving routes using `[value]/index` pattern. ([#28348](https://github.com/expo/expo/pull/28348) by [@byCedric](https://github.com/byCedric))

## 0.4.0 — 2024-04-18

### 🛠 Breaking changes

- Update Node polyfills, removing `ExpoResponse` and `ExpoRequest` globals in the process. ([#27261](https://github.com/expo/expo/pull/27261) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

- Fix using array syntax `(a,b)` with server output. ([#27462](https://github.com/expo/expo/pull/27462) by [@EvanBacon](https://github.com/EvanBacon))
- Fix issue with `duplex` streams not being properly handled. ([#27436](https://github.com/expo/expo/pull/27436) by [@EvanBacon](https://github.com/EvanBacon))
- Throw "method not found" when an API route has no exports. ([#27024](https://github.com/expo/expo/pull/27024) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.1 - 2024-02-01

### 🐛 Bug fixes

- Fix http server not properly handling headers with multiple values like Set-Cookie. ([#26652](https://github.com/expo/expo/pull/26652) by [@hdwatts](https://github.com/hdwatts))

## 0.3.0 — 2023-12-12

### 🎉 New features

- Add Vercel adapter. ([#25539](https://github.com/expo/expo/pull/25539) by [@kitten](https://github.com/kitten))

## 0.2.0 — 2023-10-17

### 🎉 New features

- Use `file` in manifest to support loading mjs/cjs API routes. ([#24739](https://github.com/expo/expo/pull/24739) by [@EvanBacon](https://github.com/EvanBacon))
- Add Netlify adapter. ([#24510](https://github.com/expo/expo/pull/24510) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 0.1.0 — 2023-09-15

_This version does not introduce any user-facing changes._
