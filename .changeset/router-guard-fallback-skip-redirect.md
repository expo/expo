---
'expo-router': patch
---

Fix an infinite loop when a `Stack.Protected` guard falls back to a route from the `redirects` config.
