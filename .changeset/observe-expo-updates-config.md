---
'expo-observe': patch
---

Add the `'expo-updates'` key to `ObserveIntegrationsConfig`, and leave function options, such as `shouldReport`, out of the integrations config that the native module stores, and warn when an enabled library integration such as `expo-updates` has not registered.
