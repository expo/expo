# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add `Observe.registerIntegration` to register an integration ([#48245](https://github.com/expo/expo/pull/48245), [#48268](https://github.com/expo/expo/pull/48268) by [@Ubax](https://github.com/Ubax))
- Expose `ObserveErrorBoundary`, a React error boundary that records render-phase errors. ([#47341](https://github.com/expo/expo/pull/47341) by [@tsapeta](https://github.com/tsapeta))
- Add `reportError` to report caught, non-fatal errors from your own `try`/`catch` blocks. ([#47871](https://github.com/expo/expo/pull/47871) by [@tsapeta](https://github.com/tsapeta))
- Add an `errorHandlingEnabled` option to `configure` to opt out of recording unhandled JavaScript errors. ([#48506](https://github.com/expo/expo/pull/48506) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix OTel date conversion ([#48161](https://github.com/expo/expo/pull/48161) by [@Ubax](https://github.com/Ubax))
- [Android] Explicitly enable `buildFeatures.buildConfig`, required by AGP 9. ([#47729](https://github.com/expo/expo/pull/47729) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- [Android] Replace pending telemetry queues with persisted row-id cursors. ([#49547](https://github.com/expo/expo/pull/49547) by [@Ubax](https://github.com/Ubax))
- [iOS] Dispatch pending metrics and logs in chunks of 200 and retry HTTP 413 responses with smaller batches. ([#49121](https://github.com/expo/expo/pull/49121) by [@Ubax](https://github.com/Ubax))
- [Android] Retry a dispatch that gets HTTP 413 ([#49016](https://github.com/expo/expo/pull/49016) by [@Ubax](https://github.com/Ubax))
- [Android] Dispatch pending metrics and logs in bounded, oldest-first chunks without replacing active background work. ([#49012](https://github.com/expo/expo/pull/49012) by [@Ubax](https://github.com/Ubax))
- Mark the `AppMetrics` export as deprecated in favor of `Observe`. ([#48901](https://github.com/expo/expo/pull/48901) by [@kadikraman](https://github.com/kadikraman))

## 57.0.9 — 2026-07-29

_This version does not introduce any user-facing changes._

## 57.0.8 — 2026-07-22

_This version does not introduce any user-facing changes._

## 57.0.7 — 2026-07-17

_This version does not introduce any user-facing changes._

## 57.0.6 — 2026-07-15

_This version does not introduce any user-facing changes._

## 57.0.5 — 2026-07-15

### 🎉 New features

- Expose configure event ([#47388](https://github.com/expo/expo/pull/47388) by [@Ubax](https://github.com/Ubax))
- Add `filteredParams` configuration option to navigation integrations ([#47488](https://github.com/expo/expo/pull/47488) by [@Ubax](https://github.com/Ubax))

### 🐛 Bug fixes

- Fix non-serializable route params issue ([#47497](https://github.com/expo/expo/pull/47497) by [@Ubax](https://github.com/Ubax))
- [Android] Fix `logEvent` not being forwarded to the AppMetrics module through the native module proxy. ([@Ubax](https://github.com/Ubax)) ([#47766](https://github.com/expo/expo/pull/47766) by [@Ubax](https://github.com/Ubax))
- [iOS] Adjust dispatch code to comply with OTLP retry spec. ([#47159](https://github.com/expo/expo/pull/47159) by [@douglowder](https://github.com/douglowder))
- [Android] Adjust dispatch code to comply with OTLP retry spec. ([@douglowder](https://github.com/douglowder)) ([#47160](https://github.com/expo/expo/pull/47160) by [@douglowder](https://github.com/douglowder))

## 57.0.4 — 2026-07-07

_This version does not introduce any user-facing changes._

## 57.0.3 — 2026-07-03

_This version does not introduce any user-facing changes._

## 57.0.2 — 2026-06-30

_This version does not introduce any user-facing changes._

## 57.0.1 — 2026-06-27

_This version does not introduce any user-facing changes._

## 57.0.0 — 2026-06-25

### 🎉 New features

- Add ObserveInteractiveMarker component ([#46909](https://github.com/expo/expo/pull/46909) by [@Ubax](https://github.com/Ubax))

### 💡 Others

- Remove the legacy non-OpenTelemetry dispatch path; metrics and logs are now always sent in the OTLP wire format. ([#47030](https://github.com/expo/expo/pull/47030) by [@tsapeta](https://github.com/tsapeta))

## 56.0.21 — 2026-06-15

_This version does not introduce any user-facing changes._

## 56.0.20 — 2026-06-10

_This version does not introduce any user-facing changes._
