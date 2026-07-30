# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Observe HTTP requests on iOS and Android and expose them to JS via the `NetworkRequestObserver` class and `useNetworkRequestObserver` hook. The TTI metric also carries an `expo.network.requests.*` summary for requests that completed in the launch window. ([#46475](https://github.com/expo/expo/pull/46475) by [@tsapeta](https://github.com/tsapeta))
- Add native-side filtering to `NetworkRequestObserver` by host and method, configurable at construction or at runtime via `setFilter`, so non-matching requests never cross into JS. ([#46775](https://github.com/expo/expo/pull/46775) by [@tsapeta](https://github.com/tsapeta))
- Capture unhandled JavaScript errors on iOS and Android by wrapping React Native's `global.ErrorUtils` handler, recording each as an `exception` log event following OpenTelemetry's exception conventions (`exception.type`/`exception.message`/`exception.stacktrace`). Fatal errors are written to disk synchronously before the process terminates and ingested on the next launch. ([#46923](https://github.com/expo/expo/pull/46923) by [@tsapeta](https://github.com/tsapeta))
- Add android crash reports ([#46869](https://github.com/expo/expo/pull/46869) by [@Ubax](https://github.com/Ubax))
- Record an `expo.memory.warning` log event on iOS when the system delivers a low-memory warning, carrying the memory usage snapshot (`expo.memory.*`) taken at warning time. ([#47108](https://github.com/expo/expo/pull/47108) by [@tsapeta](https://github.com/tsapeta))
- Add an optional `displayName` to `logEvent` ([#47289](https://github.com/expo/expo/pull/47289) by [@Ubax](https://github.com/Ubax))
- Capture React render-phase errors via `AppMetricsErrorBoundary`. ([#47341](https://github.com/expo/expo/pull/47341) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix integer metric and log attributes equal to `0` or `1` serializing as booleans on iOS. ([#47108](https://github.com/expo/expo/pull/47108) by [@tsapeta](https://github.com/tsapeta))
- fix race condition between db inserts ([#46702](https://github.com/expo/expo/pull/46702) by [@Ubax](https://github.com/Ubax))
- [tvOS] Fix path for DB creation. ([#46715](https://github.com/expo/expo/pull/46715) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Rename the no-update `downloadComplete` state event to `downloadCompleteUnavailable`. ([#47902](https://github.com/expo/expo/pull/47902) by [@kudo](https://github.com/kudo))
- [iOS] Measure the JS bundle load time against the app startup end marker to stay compatible with upcoming React Native versions. ([#47782](https://github.com/expo/expo/pull/47782) by [@tsapeta](https://github.com/tsapeta))
- Remove the unstable, development-only `triggerCrash` and `simulateCrashReport` APIs. ([#46924](https://github.com/expo/expo/pull/46924) by [@Ubax](https://github.com/Ubax))
- Add a `caught` source to the private `reportError` for errors reported from user code. ([#47871](https://github.com/expo/expo/pull/47871) by [@tsapeta](https://github.com/tsapeta))
- Add private `getForegroundSession` ([#46657](https://github.com/expo/expo/pull/46657) by [@Ubax](https://github.com/Ubax))
- Add session shared object API ([#46652](https://github.com/expo/expo/pull/46652) by [@Ubax](https://github.com/Ubax))
