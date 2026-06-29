# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Expose `ObserveErrorBoundary`, a React error boundary that records render-phase errors as `exception` log events and renders a `fallback` in place of the crashed subtree. ([#47340](https://github.com/expo/expo/pull/47340) by [@tsapeta](https://github.com/tsapeta))
- Add ObserveInteractiveMarker component ([#46909](https://github.com/expo/expo/pull/46909) by [@Ubax](https://github.com/Ubax))
- Expose configure event ([#47388](https://github.com/expo/expo/pull/47388) by [@Ubax](https://github.com/Ubax))

### 🐛 Bug fixes

- [iOS] Adjust dispatch code to comply with OTLP retry spec. ([#47159](https://github.com/expo/expo/pull/47159) by [@douglowder](https://github.com/douglowder))
- [Android] Adjust dispatch code to comply with OTLP retry spec. ([@douglowder](https://github.com/douglowder)) ([#47160](https://github.com/expo/expo/pull/47160) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Remove the legacy non-OpenTelemetry dispatch path; metrics and logs are now always sent in the OTLP wire format. ([#47030](https://github.com/expo/expo/pull/47030) by [@tsapeta](https://github.com/tsapeta))
