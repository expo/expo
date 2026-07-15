# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
