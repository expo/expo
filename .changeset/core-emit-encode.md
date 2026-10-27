---
'expo-modules-core': patch
---

[iOS] Add `EventEmitter.emit(event:payload:encode:)`, which emits a payload converted by a closure. `expo-modules-macros` uses it for an `@Event` whose payload holds a tuple, which can't conform to `JavaScriptEncodable`.
