---
'expo-observe': patch
---

Add an internal registry for the Observe integrations of Expo libraries that cannot depend on `expo-observe`. Each registered integration gets a reporter that sends its errors and warnings with the `integration` source, an error code, the integration's `shouldReport` option from the latest `configure` call, and a rate limit.
