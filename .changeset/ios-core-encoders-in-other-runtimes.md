---
'expo-modules-core': patch
---

[iOS] Fix conversions to a value of a runtime other than the main runtime, for example the worklet UI runtime. A `TypedArray` of another runtime, and a record that the `@Record` macro doesn't convert, now throw an error instead of using the main runtime from another thread.
