# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Observe HTTP requests on iOS and Android and expose them to JS via the `NetworkRequestObserver` class and `useNetworkRequestObserver` hook. The TTI metric also carries an `expo.network.requests.*` summary for requests that completed in the launch window. ([#46475](https://github.com/expo/expo/pull/46475) by [@tsapeta](https://github.com/tsapeta))
- Add native-side filtering to `NetworkRequestObserver` by host and method, configurable at construction or at runtime via `setFilter`, so non-matching requests never cross into JS. ([#46775](https://github.com/expo/expo/pull/46775) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- fix race condition between db inserts ([#46702](https://github.com/expo/expo/pull/46702) by [@Ubax](https://github.com/Ubax))
- [tvOS] Fix path for DB creation. ([#46715](https://github.com/expo/expo/pull/46715) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Remove the unstable, development-only `triggerCrash` and `simulateCrashReport` APIs. 
- Add private `getForegroundSession` ([#46657](https://github.com/expo/expo/pull/46657) by [@Ubax](https://github.com/Ubax))
- Add session shared object API ([#46652](https://github.com/expo/expo/pull/46652) by [@Ubax](https://github.com/Ubax))
