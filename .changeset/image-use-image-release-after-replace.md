---
'expo-image': patch
---

Fix `useImage` releasing the previous image while it was still rendered. In development builds, this made React throw `ERR_NATIVE_SHARED_OBJECT_NOT_FOUND` and stop rendering after the source changed.
