---
'expo-modules-core': patch
---

[Internal] [iOS] Make `ExpoNetworkReporter` a thread-safe singleton, matching `RCTInspectorNetworkReporter`, and store text response bodies through `RCTInspectorNetworkReporter.maybeStoreResponseBody(_:body:)`.
