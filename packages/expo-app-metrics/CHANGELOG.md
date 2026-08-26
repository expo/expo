# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 57.0.15 — 2026-08-26

_This version does not introduce any user-facing changes._

## 57.0.14 — 2026-08-24

### 🐛 Bug fixes

- [iOS] Preserve millisecond precision in log event timestamps. ([#49141](https://github.com/expo/expo/pull/49141) by [@Ubax](https://github.com/Ubax))

## 57.0.13 — 2026-08-20

### 💡 Others

- [iOS] Add an optional limit when reading pending metric and log rows. ([#49121](https://github.com/expo/expo/pull/49121) by [@Ubax](https://github.com/Ubax))
- [Android] Load only requested metric and log rows when preparing observability payloads. ([#49011](https://github.com/expo/expo/pull/49011) by [@Ubax](https://github.com/Ubax))

## 57.0.12 — 2026-08-17

_This version does not introduce any user-facing changes._

## 57.0.11 — 2026-08-14

_This version does not introduce any user-facing changes._

## 57.0.10 — 2026-08-10

_This version does not introduce any user-facing changes._

## 57.0.9 — 2026-08-06

### 🐛 Bug fixes

- [android] Fix `UnsupportedOperationException` and `NoSuchMethodError` on Android 7.x ([#48577](https://github.com/expo/expo/pull/48577) by [@Ubax](https://github.com/Ubax))

## 57.0.8 — 2026-08-04

### 🎉 New features

- Add an optional `displayName` to `logEvent` ([#47289](https://github.com/expo/expo/pull/47289) by [@Ubax](https://github.com/Ubax))
- Capture React render-phase errors via `AppMetricsErrorBoundary`. ([#47341](https://github.com/expo/expo/pull/47341) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [Android] Replace deprecated `fallbackToDestructiveMigration()` with `fallbackToDestructiveMigration(false)`. ([#47489](https://github.com/expo/expo/pull/47489) by [@Ubax](https://github.com/Ubax))
- [iOS] Fix a crash on FirebaseAuth's first token refresh. GTMSessionFetcher branches on the class of `session.delegate`, so our network-observing delegate proxy now answers class and protocol checks for the delegate it wraps. ([#48360](https://github.com/expo/expo/pull/48360) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] Measure the JS bundle load time against the app startup end marker to stay compatible with upcoming React Native versions. ([#47782](https://github.com/expo/expo/pull/47782) by [@tsapeta](https://github.com/tsapeta))
- Add a `caught` source to the private `reportError` for errors reported from user code. ([#47871](https://github.com/expo/expo/pull/47871) by [@tsapeta](https://github.com/tsapeta))

## 57.0.7 — 2026-07-29

_This version does not introduce any user-facing changes._

## 57.0.6 — 2026-07-22

_This version does not introduce any user-facing changes._

## 57.0.5 — 2026-07-17

_This version does not introduce any user-facing changes._

## 57.0.4 — 2026-07-15

_This version does not introduce any user-facing changes._

## 57.0.3 — 2026-07-15

_This version does not introduce any user-facing changes._

## 57.0.2 — 2026-07-03

_This version does not introduce any user-facing changes._

## 57.0.1 — 2026-06-27

_This version does not introduce any user-facing changes._

## 57.0.0 — 2026-06-25

### 🎉 New features

- Observe HTTP requests on iOS and Android and expose them to JS via the `NetworkRequestObserver` class and `useNetworkRequestObserver` hook. The TTI metric also carries an `expo.network.requests.*` summary for requests that completed in the launch window. ([#46475](https://github.com/expo/expo/pull/46475) by [@tsapeta](https://github.com/tsapeta))
- Add native-side filtering to `NetworkRequestObserver` by host and method, configurable at construction or at runtime via `setFilter`, so non-matching requests never cross into JS. ([#46775](https://github.com/expo/expo/pull/46775) by [@tsapeta](https://github.com/tsapeta))
- Capture unhandled JavaScript errors on iOS and Android by wrapping React Native's `global.ErrorUtils` handler, recording each as an `exception` log event following OpenTelemetry's exception conventions (`exception.type`/`exception.message`/`exception.stacktrace`). Fatal errors are written to disk synchronously before the process terminates and ingested on the next launch. ([#46923](https://github.com/expo/expo/pull/46923) by [@tsapeta](https://github.com/tsapeta))
- Add android crash reports ([#46869](https://github.com/expo/expo/pull/46869) by [@Ubax](https://github.com/Ubax))
- Record an `expo.memory.warning` log event on iOS when the system delivers a low-memory warning, carrying the memory usage snapshot (`expo.memory.*`) taken at warning time. ([#47108](https://github.com/expo/expo/pull/47108) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix integer metric and log attributes equal to `0` or `1` serializing as booleans on iOS. ([#47108](https://github.com/expo/expo/pull/47108) by [@tsapeta](https://github.com/tsapeta))
- fix race condition between db inserts ([#46702](https://github.com/expo/expo/pull/46702) by [@Ubax](https://github.com/Ubax))
- [tvOS] Fix path for DB creation. ([#46715](https://github.com/expo/expo/pull/46715) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Remove the unstable, development-only `triggerCrash` and `simulateCrashReport` APIs. ([#46924](https://github.com/expo/expo/pull/46924) by [@Ubax](https://github.com/Ubax))
- Add private `getForegroundSession` ([#46657](https://github.com/expo/expo/pull/46657) by [@Ubax](https://github.com/Ubax))

## 56.0.19 — 2026-06-15

_This version does not introduce any user-facing changes._

## 56.0.18 — 2026-06-10

### 🐛 Bug fixes

- fix race condition between db inserts ([#46702](https://github.com/expo/expo/pull/46702) by [@Ubax](https://github.com/Ubax))
