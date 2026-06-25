# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Wrap `getStaticContent` and `getStreamingContent` in `expo-font`'s per-render `withServerContext` scope so concurrent server renders cannot share font registry state. ([#46669](https://github.com/expo/expo/pull/46669) by [@hassankhan](https://github.com/hassankhan))
- Render external CSS imports as `<link rel="stylesheet">` nodes when using the streaming renderer ([#46984](https://github.com/expo/expo/pull/46984) by [@hassankhan](https://github.com/hassankhan))

### 💡 Others

- [Internal] Unify favicon injection between SPA, SSG and SSR pipelines ([#46586](https://github.com/expo/expo/pull/46586) by [@hassankhan](https://github.com/hassankhan))

## 56.0.14 — 2026-06-10

_This version does not introduce any user-facing changes._

## 56.0.13 — 2026-06-05

### 🐛 Bug fixes

- Use favicon from app config when SSR is enabled ([#46570](https://github.com/expo/expo/pull/46570) by [@hassankhan](https://github.com/hassankhan))

## 56.0.12 — 2026-05-26

_This version does not introduce any user-facing changes._

## 56.0.11 — 2026-05-21

_This version does not introduce any user-facing changes._

## 56.0.10 — 2026-05-20

### 🐛 Bug fixes

- Add missing HTML attribute escaping for inserted asset URLs ([#45848](https://github.com/expo/expo/pull/45848) by [@kitten](https://github.com/kitten))

## 56.0.9 — 2026-05-19

### 🐛 Bug fixes

- Reject RSC server-action invocations that aren't HTTP POST ([#45905](https://github.com/expo/expo/pull/45905) by [@kitten](https://github.com/kitten))
- Enforce `Sec-Fetch-Site` or `expo-platform` header values ([#45905](https://github.com/expo/expo/pull/45905) by [@kitten](https://github.com/kitten))
- Fix RSC falling through on lookup causing unexpected errors ([#45895](https://github.com/expo/expo/pull/45895) by [@kitten](https://github.com/kitten))

### 💡 Others

- [Internal] Align RSC server routing with expo-server/expo-router's canonical matchers ([#45900](https://github.com/expo/expo/pull/45900) by [@kitten](https://github.com/kitten))
- Enforce that RSC `skip` parameter cannot skip layouts anymore ([#45900](https://github.com/expo/expo/pull/45900) by [@kitten](https://github.com/kitten))
- [Internal] Remove RSC render context and remove render store global ([#45908](https://github.com/expo/expo/pull/45908) by [@kitten](https://github.com/kitten))

## 56.0.8 — 2026-05-13

_This version does not introduce any user-facing changes._

## 56.0.7 — 2026-05-13

### 💡 Others

- Bump to `react-server-dom-webpack@~19.0.6` ([#45645](https://github.com/expo/expo/pull/45645) by [@kitten](https://github.com/kitten))

## 56.0.6 — 2026-05-12

_This version does not introduce any user-facing changes._

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
