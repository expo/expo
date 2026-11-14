---
'expo-modules-core': patch
---

[iOS] Add `AppContext.attach(runtime:)`, which prepares another runtime to use the app context. The worklet UI runtime uses it, and `installOnUIRuntime` now throws when that preparation fails.
