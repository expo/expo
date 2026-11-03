---
'expo-modules-core': patch
---

[iOS] Reduce the overhead of emitting events with a `JavaScriptEncodable` payload, including from `@Event` properties, by specializing `emit(event:payload:)` for the payload type in the caller's module.
