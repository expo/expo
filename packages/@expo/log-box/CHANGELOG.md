# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.7 — 2026-05-11

_This version does not introduce any user-facing changes._

## 56.0.6 — 2026-05-08

### 🐛 Bug fixes

- Fix error overlay footer overlapping content by using fixed positioning and adding bottom padding. ([#45526](https://github.com/expo/expo/pull/45526) by [@EvanBacon](https://github.com/EvanBacon))

## 56.0.5 — 2026-05-07

_This version does not introduce any user-facing changes._

## 56.0.4 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-05

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Stop @expo/log-box from rebuilding on every pnpm install ([#44330](https://github.com/expo/expo/pull/44330) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### ⚠️ Notices

- Added support for React Native 0.84.x. ([#43018](https://github.com/expo/expo/pull/43018) by [@chrfalch](https://github.com/chrfalch))

## 55.0.12 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.11 - 2026-04-21

### 💡 Others

- Use `OkHttpClientProvider` instead of raw `OkHttpClient` ([#44416](https://github.com/expo/expo/pull/44416)) by [@cortinico](https://github.com/cortinico) ([#44416](https://github.com/expo/expo/pull/44416) by [@cortinico](https://github.com/cortinico))

## 55.0.10 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.9 - 2026-04-02

### 🐛 Bug fixes

- Add native no-op for `renderInShadowRoot` to avoid `react-dom` resolution errors on native platforms. ([#43893](https://github.com/expo/expo/issues/43893)) ([#44190](https://github.com/expo/expo/pull/44190) by [@mvincentong](https://github.com/mvincentong))

## 55.0.8 - 2026-03-27

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-16

### 🐛 Bug fixes

- Add missing `Content-Type: application/json` to `/symbolicate` requests ([#43074](https://github.com/expo/expo/pull/43074) by [@kitten](https://github.com/kitten))

## 55.0.6 — 2026-02-08

### 🐛 Bug fixes

- Migrate away from react-native-web to fix styles in SPA output. ([#42853](https://github.com/expo/expo/pull/42853) by [@EvanBacon](https://github.com/EvanBacon))

## 55.0.5 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

### 🐛 Bug fixes

- Drop `react-native-web` and `react-dom` peers ([#42728](https://github.com/expo/expo/pull/42728) by [@kitten](https://github.com/kitten))

## 55.0.3 — 2026-01-27

### 🐛 Bug fixes

- absolute position web content to prevent modifying body layout. ([#42565](https://github.com/expo/expo/pull/42565) by [@EvanBacon](https://github.com/EvanBacon))

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🎉 New features

- Add error overlay for Expo apps (initial release) ([#39958](https://github.com/expo/expo/pull/39958) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### 🐛 Bug fixes

- Fix missing backdrop blur on Web ([#40737](https://github.com/expo/expo/pull/40737) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### ⚠️ Notices

- Added support for React Native 0.83.x. ([#41564](https://github.com/expo/expo/pull/41564) by [@gabrieldonadel](https://github.com/gabrieldonadel))
