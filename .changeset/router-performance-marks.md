---
'expo-router': patch
---

Replace the experimental `unstable_navigationEvents` API with `unstable_performance` and `unstable_PerformanceObserver`, which record navigation as `performance` marks with a `detail` and a `startTime`. This is a breaking change: `unstable_navigationEvents` and its event types are removed.
