---
'expo-modules-core': minor
---

[iOS] Shared objects can have event listeners in every runtime of the app context, for example in the worklet UI runtime. A native `emit` reaches the listeners in all runtimes. `emitInline`, `emitBlocking` and `emit` with a `JavaScriptValue` payload reach only the listeners in the main runtime.
