# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.8 — 2026-05-13

_This version does not introduce any user-facing changes._

## 56.0.7 — 2026-05-13

_This version does not introduce any user-facing changes._

## 56.0.6 — 2026-05-12

_This version does not introduce any user-facing changes._

## 56.0.5 — 2026-05-08

### 💡 Others

- Remove pinned dependencies ([#45520](https://github.com/expo/expo/pull/45520) by [@kitten](https://githun.com/kitten))

## 56.0.4 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-05

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### ⚠️ Notices

- Added support for React Native 0.84.x. ([#43018](https://github.com/expo/expo/pull/43018) by [@chrfalch](https://github.com/chrfalch))

## 55.0.11 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-04-21

_This version does not introduce any user-facing changes._

## 55.0.9 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.8 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.7 - 2026-03-27

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🎉 New features

- Move error overlay UI to `@expo/log-box` package ([#39958](https://github.com/expo/expo/pull/39958) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### ⚠️ Notices

- Added support for React Native 0.82.x. ([#39678](https://github.com/expo/expo/pull/39678) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 6.1.2 — 2025-09-12

### 🐛 Bug fixes

- Move `@expo/metro-runtime` to peer dependencies, since that conveys our intention better ([#39603](https://github.com/expo/expo/pull/39603) by [@kitten](https://github.com/kitten))

## 6.1.1 — 2025-08-26

### 🐛 Bug fixes

- Avoid sending compilation errors back to Metro terminal from the application runtime ([#39142](https://github.com/expo/expo/pull/39142) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 6.1.0 — 2025-08-19

### 🎉 New features

- Pass errors, synthetic and owners stacks to Metro Dev Server terminal ([#38871](https://github.com/expo/expo/pull/38871) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 6.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 6.0.1 — 2025-08-15

### 🐛 Bug fixes

- Show `console.error` and LogBox for unhandled promise rejection in development ([#38834](https://github.com/expo/expo/pull/38834) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 6.0.0 — 2025-08-13

### 🛠 Breaking changes

- Move async-require and fast refresh to `expo`. ([#36405](https://github.com/expo/expo/pull/36405) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- noop unused code on native to suppress react-native import warnings. ([#38495](https://github.com/expo/expo/pull/38495) by [@EvanBacon](https://github.com/EvanBacon))
- Update dependencies to align with transitive dependencies ([#38532](https://github.com/expo/expo/pull/38532) by [@kitten](https://github.com/kitten))

## 5.0.4 — 2025-04-28

### 💡 Others

- Move virtual RSC client boundary entry point to `expo`. ([#36408](https://github.com/expo/expo/pull/36408) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `/symbolicate` import. ([#36409](https://github.com/expo/expo/pull/36409) by [@EvanBacon](https://github.com/EvanBacon))

## 5.0.3 — 2025-04-28

### 💡 Others

- Remove `web-streams-polyfill` in favor of `expo` support. ([#36407](https://github.com/expo/expo/pull/36407) by [@EvanBacon](https://github.com/EvanBacon))

## 5.0.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 5.0.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 5.0.0 — 2025-04-04

### 🛠 Breaking changes

- Remove global polyfill for deprecated `setImmediate` function. ([#35373](https://github.com/expo/expo/pull/35373) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Parse errors with Babel code frames as syntax errors on Windows. ([#34017](https://github.com/expo/expo/pull/34017) by [@byCedric](https://github.com/byCedric))
- Fixed broken async import. ([#34824](https://github.com/expo/expo/pull/34824) by [@kudo](https://github.com/kudo))

### 💡 Others

- Remove unused log. ([#35894](https://github.com/expo/expo/pull/35894) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.1 - 2025-01-19

### 🐛 Bug fixes

- Only reload RSC for a given platform. ([#34216](https://github.com/expo/expo/pull/34216) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- fix: add e2e testing to server function errors ([#33971](https://github.com/expo/expo/pull/33971) by [@EvanBacon](https://github.com/EvanBacon))
- Use `window.location` polyfill for server requests. ([#32099](https://github.com/expo/expo/pull/32099) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0 — 2024-11-11

_This version does not introduce any user-facing changes._

## 4.0.0-preview.2 — 2024-11-05

### 💡 Others

- Use `window.location` polyfill for server requests. ([#32099](https://github.com/expo/expo/pull/32099) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0-preview.1 — 2024-11-04

### 💡 Others

- Move server action env to `@expo/metro-runtime`. ([#32597](https://github.com/expo/expo/pull/32597) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0-preview.0 — 2024-10-22

### 🎉 New features

- Enable relative fetch requests by default. ([#31707](https://github.com/expo/expo/pull/31707) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for CSS in server components. ([#31073](https://github.com/expo/expo/pull/31073) by [@EvanBacon](https://github.com/EvanBacon))
- Add initial version of DOM Components. ([#30938](https://github.com/expo/expo/pull/30938) by [@EvanBacon](https://github.com/EvanBacon))
- Add server HMR for native. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))
- Add streaming fetch polyfill. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))
- Use `src` directory for source code. ([#30300](https://github.com/expo/expo/pull/30300) by [@EvanBacon](https://github.com/EvanBacon))
- Always enable async bundle loading on native. ([#30146](https://github.com/expo/expo/pull/30146) by [@EvanBacon](https://github.com/EvanBacon))
- Support `location.reload()` in native production builds. ([#29572](https://github.com/expo/expo/pull/29572) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix logbox usage on native for router errors. ([#30651](https://github.com/expo/expo/pull/30651) by [@EvanBacon](https://github.com/EvanBacon))
- Update DevLoadingView on native. ([#30606](https://github.com/expo/expo/pull/30606) by [@EvanBacon](https://github.com/EvanBacon))
- Fix metro symbolication issue with web import errors. ([#30544](https://github.com/expo/expo/pull/30544) by [@EvanBacon](https://github.com/EvanBacon))
- Remount the failed component when a refresh event occurs. ([#30544](https://github.com/expo/expo/pull/30544) by [@EvanBacon](https://github.com/EvanBacon))
- Fix web styling bug. ([#30438](https://github.com/expo/expo/pull/30438) by [@EvanBacon](https://github.com/EvanBacon))
- Fix exceptions native import. ([#30433](https://github.com/expo/expo/pull/30433) by [@EvanBacon](https://github.com/EvanBacon))
- Improve error message for `window.location` polyfill. ([#30331](https://github.com/expo/expo/pull/30331) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent `LogBoxStateSubscription` calling `setState` while rendering a `<Suspense />` boundary. ([#32047](https://github.com/expo/expo/pull/32047) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Improve API route errors ([#31485](https://github.com/expo/expo/pull/31485) by [@EvanBacon](https://github.com/EvanBacon))
- Remove downloading indicator for split bundles. ([#30146](https://github.com/expo/expo/pull/30146) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.3 - 2024-08-14

_This version does not introduce any user-facing changes._

## 3.2.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 3.2.0 — 2024-04-18

### 🎉 New features

- Mark React client components with "use client" directives. ([#27300](https://github.com/expo/expo/pull/27300) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix async loader for web being able to reload the entrypoint bundle. ([#28016](https://github.com/expo/expo/pull/28016) by [@kitten](https://github.com/kitten))

### 💡 Others

- Use `process.env.EXPO_OS` platform env checks to reduce `react-native` imports. ([#27636](https://github.com/expo/expo/pull/27636) by [@EvanBacon](https://github.com/EvanBacon))
- Use `typeof window` checks for removing server code. ([#27514](https://github.com/expo/expo/pull/27514) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.3 - 2024-02-06

### 🎉 New features

- Send platform to Metro. ([#26812](https://github.com/expo/expo/pull/26812) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.2 - 2024-01-23

### 🎉 New features

- Add error handling for Metro build errors in split chunks. ([#26609](https://github.com/expo/expo/pull/26609) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.1 - 2024-01-18

### 🐛 Bug fixes

- Fixed lazy component errors on Android. ([#26464](https://github.com/expo/expo/pull/26464) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2023-12-12

### 🎉 New features

- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Use `build` directory for native usage. ([#25655](https://github.com/expo/expo/pull/25655) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Skip showing "Downloading..." overlay on web. ([#25832](https://github.com/expo/expo/pull/25832) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.4 — 2023-11-14

### 💡 Others

- Improve testing for URL support on native. ([#25240](https://github.com/expo/expo/pull/25240) by [@EvanBacon](https://github.com/EvanBacon))
- Migrate to new standard `URL` support on native. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.3 — 2023-10-17

### 💡 Others

- Update jsx transpilation. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.2 — 2023-09-15

### 🎉 New features

- Enable async code loading in production for web. ([#24291](https://github.com/expo/expo/pull/24291) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Use `DeviceEventEmitter`. ([#24298](https://github.com/expo/expo/pull/24298) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Reduce size on web. ([#24294](https://github.com/expo/expo/pull/24294) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.1 — 2023-09-04

### 🎉 New features

- Tree shake error symbolication code in production. ([#24215](https://github.com/expo/expo/pull/24215) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Use `fixed` position for floating toast. ([#24074](https://github.com/expo/expo/pull/24074) by [@EvanBacon](https://github.com/EvanBacon))
- Fix error overlay not being applied on web. ([#24052](https://github.com/expo/expo/pull/24052) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Transpile down to commonjs for running in Node.js. ([#23871](https://github.com/expo/expo/pull/23871) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.0 — 2023-08-02

_This version does not introduce any user-facing changes._
