---
'expo-observe': patch
---

Pass a reporter to `Observe.registerIntegration` callbacks. It reports the integration's errors and warnings with the `integration` source, an error code, the integration's `shouldReport` option from the latest `configure` call, and a rate limit.
