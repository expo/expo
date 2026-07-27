# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Expose `ObserveErrorBoundary`, a React error boundary that records render-phase errors. ([#47341](https://github.com/expo/expo/pull/47341) by [@tsapeta](https://github.com/tsapeta))
- Add ObserveInteractiveMarker component ([#46909](https://github.com/expo/expo/pull/46909) by [@Ubax](https://github.com/Ubax))
- Expose configure event ([#47388](https://github.com/expo/expo/pull/47388) by [@Ubax](https://github.com/Ubax))
- Add `filteredParams` configuration option to navigation integrations ([#47488](https://github.com/expo/expo/pull/47488) by [@Ubax](https://github.com/Ubax))
- Add `reportError` to report caught, non-fatal errors from your own `try`/`catch` blocks. ([#47871](https://github.com/expo/expo/pull/47871) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [Android] Fix `logEvent` not being forwarded to the AppMetrics module through the native module proxy. ([@Ubax](https://github.com/Ubax)) ([#47766](https://github.com/expo/expo/pull/47766) by [@Ubax](https://github.com/Ubax))
- Fix non-serializable route params issue ([#47497](https://github.com/expo/expo/pull/47497) by [@Ubax](https://github.com/Ubax))
- [iOS] Adjust dispatch code to comply with OTLP retry spec. ([#47159](https://github.com/expo/expo/pull/47159) by [@douglowder](https://github.com/douglowder))
- [Android] Adjust dispatch code to comply with OTLP retry spec. ([@douglowder](https://github.com/douglowder)) ([#47160](https://github.com/expo/expo/pull/47160) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Remove the legacy non-OpenTelemetry dispatch path; metrics and logs are now always sent in the OTLP wire format. ([#47030](https://github.com/expo/expo/pull/47030) by [@tsapeta](https://github.com/tsapeta))
