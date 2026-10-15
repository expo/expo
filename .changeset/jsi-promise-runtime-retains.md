---
'expo-modules-jsi': patch
---

[iOS] Make creating and resolving a `JavaScriptPromise` faster. Resolving no longer allocates an arguments buffer, the initializers borrow the runtime instead of retaining it, and the promise keeps its values without an extra allocation each.
