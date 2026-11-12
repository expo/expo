---
'expo-observe': patch
---

Add `registerObserveIntegration` and a global registry, so an integration that lives in another library gets its original config, including functions, and reports errors and warnings with the `integration` source, the shared `ignoredCodes` and `shouldReport` filter, the rate limit and an error code.
