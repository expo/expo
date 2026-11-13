---
'expo-observe': major
---

Move the JavaScript code of `expo-app-metrics` into `expo-observe`. `expo-observe` no longer depends on `expo-app-metrics`. Import the API from `expo-observe` or `expo-observe/debug`:

- `import AppMetrics from 'expo-app-metrics'` -> `import { Observe } from 'expo-observe'`. The deprecated `AppMetrics` export of `expo-observe` keeps the debug methods.
- `AppMetricsRoot` -> `ObserveRoot`. `AppMetricsErrorBoundary` -> `ObserveErrorBoundary`.
- `startSpan`, `withSpan`, `recordSpan` -> `Observe.startSpan`, `Observe.withSpan`, `Observe.recordSpan`.
- `useNetworkRequestObserver` and the debug types -> `expo-observe/debug`.
- `setErrorHandlerEnabled` -> the `errorHandlingEnabled` option of `Observe.configure`.
- The types `AppStartupTimes`, `CallStack`, `FrameRateMetrics`, `MemoryUsageSnapshot`, `MetricInput`, `NetworkRequestObserverEvents`, `NetworkTracesConfig`, and `UseNetworkRequestObserverOptions` are no longer exported.
