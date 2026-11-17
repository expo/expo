---
'expo-modules-core': patch
---

[iOS] Support shared objects in worklets. A worklet can capture a shared object, whose JS objects in all runtimes share one native state, and which is kept until none of them is referenced. Event listeners are supported only in the main runtime.
