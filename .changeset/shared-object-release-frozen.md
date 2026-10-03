---
'expo-modules-core': patch
---

Fixed `release()` throwing on a shared object whose JS object is frozen, for example an `ImageRef` passed as a view prop in development ([#50962](https://github.com/expo/expo/issues/50962)).
