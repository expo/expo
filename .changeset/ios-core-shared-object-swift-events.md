---
'expo-modules-core': patch
---

[iOS] Keep the event listeners of shared objects in Swift. Emitting an event from native code is faster for modules and shared objects, and a subscription no longer keeps its shared object alive after its listener is removed with `removeListener`.
