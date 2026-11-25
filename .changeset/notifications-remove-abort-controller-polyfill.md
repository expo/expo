---
'expo-notifications': patch
---

Remove the `abort-controller` dependency. The package now uses the global `AbortController` that React Native and web browsers provide.
