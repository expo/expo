---
'expo-modules-core': patch
---

Shared objects now report their class name from `Object.prototype.toString`, for example `[object VideoPlayer]`. React in development builds no longer deep-compares shared objects in props, which threw `ERR_NATIVE_SHARED_OBJECT_NOT_FOUND` when the previous props held a released shared object. `Blob` from `expo-blob` and `File` from `expo-file-system` now report `[object Blob]` and `[object File]`, as on the web. Libraries that detect these types by this tag now treat them as a `Blob` and a `File`.
