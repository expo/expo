# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.5 — 2026-05-08

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

### 🎉 New features

- Use stream rendering in SSR ([#43963](https://github.com/expo/expo/pull/43963) by [@hassankhan](https://github.com/hassankhan))
- Add support for metadata in streaming SSR ([#44731](https://github.com/expo/expo/pull/44731) by [@hassankhan](https://github.com/hassankhan))
- Support streaming SSR in development ([#45362](https://github.com/expo/expo/pull/45362) by [@hassankhan](https://github.com/hassankhan))

### 💡 Others

- Replace `TransformStream`-based HTML injection with `ServerDocumentContext` for SSR metadata and assets ([#44827](https://github.com/expo/expo/pull/44827) by [@hassankhan](https://github.com/hassankhan))

## 55.0.16 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.15 - 2026-04-21

_This version does not introduce any user-facing changes._

## 55.0.14 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.13 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.11 - 2026-03-18

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-03-11

### 💡 Others

- Handle empty routes manifest gracefully ([#43606](https://github.com/expo/expo/pull/43606) by [@kitten](https://github.com/kitten))

## 55.0.9 - 2026-02-26

_This version does not introduce any user-facing changes._

## 55.0.8 — 2026-02-25

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

### 🐛 Bug fixes

- Key loader data by `contextKey` instead of URL pathname ([#43017](https://github.com/expo/expo/pull/43017) by [@hassankhan]

## 55.0.5 — 2026-02-03

### 💡 Others

- Open up `expo-font` dependency range in `@expo/router-server` ([#42808](https://github.com/expo/expo/pull/42808) by [@kitten](https://github.com/kitten))

## 55.0.4 — 2026-02-03

### 🐛 Bug fixes

- Mark `expo-router` as optional peer to prevent auto-installation ([#42728](https://github.com/expo/expo/pull/42728) by [@kitten](https://github.com/kitten))

### 💡 Others

- Deprecate undocumented `expo-router/rsc/headers` RSC API in favor of `expo-server`'s `requestHeaders` runtime API ([#42678](https://github.com/expo/expo/pull/42678) by [@hassankhan](https://github.com/hassankhan))

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-23

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

### 🐛 Bug fixes

- Treat both `null` and `undefined` loader responses as `null` ([#42419](https://github.com/expo/expo/pull/42419) by [@hassankhan](https://github.com/hassankhan))

## 55.0.0 — 2026-01-21

### 🎉 New features

- Add support for server data loaders in static export mode ([#40130](https://github.com/expo/expo/pull/40130) by [@hassankhan](https://github.com/hassankhan))
- Improve SSR support ([#41477](https://github.com/expo/expo/pull/41477) by [@hassankhan](https://github.com/hassankhan))

### 🐛 Bug fixes

- resolve "Illegal invocation" errors in `workerd` runtime ([#41502](https://github.com/expo/expo/pull/41502) by [@hassankhan](https://github.com/hassankhan))
- Preserve search params for loader data fetches ([#42227](https://github.com/expo/expo/pull/42227) by [@hassankhan](https://github.com/hassankhan))
- Handle `undefined` loader return values in server rendering ([#42367](https://github.com/expo/expo/pull/42367) by [@hassankhan](https://github.com/hassankhan))

### 💡 Others

- Migrate static rendering logic from `expo-router` to `@expo/router-server` ([#39374](https://github.com/expo/expo/pull/39374) by [@hassankhan](https://github.com/hassankhan))
- Migrate RSC logic from `expo-router` to `@expo/router-server` ([#40484](https://github.com/expo/expo/pull/40484) by [@hassankhan](https://github.com/hassankhan))
- Migrate UI code back to `expo-router` ([#40510](https://github.com/expo/expo/pull/40510) by [@hassankhan](https://github.com/hassankhan))
- Expose internal API for use in `@expo/router-server` ([#40545](https://github.com/expo/expo/pull/40545) by [@hassankhan](https://github.com/hassankhan))
- Migrate typed routes logic from `expo-router` to `@expo/router-server` ([#40576](https://github.com/expo/expo/pull/40576) by [@hassankhan](https://github.com/hassankhan))
- Deduplicate shared types across `@expo/cli`, `@expo/router-server`, `expo-server` ([#40614](https://github.com/expo/expo/pull/40614) by [@hassankhan](https://github.com/hassankhan))
- Use object instead of tuple for `FlatNode` representation ([#40613](https://github.com/expo/expo/pull/40613) by [@hassankhan](https://github.com/hassankhan))
- Bump and tighten `react-server-dom-webpack` peer range ([#41379](https://github.com/expo/expo/pull/41379) by [@kitten](https://github.com/kitten))
- Unify nullish value handling for data loaders ([#42070](https://github.com/expo/expo/pull/42070) by [@hassankhan](https://github.com/hassankhan))
