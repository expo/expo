---
'expo-modules-jsi': patch
---

[iOS] Speed up `TypedArray` checks, `JavaScriptTypedArray` construction, and `Data` decoding using React Native 0.86+ native JSI `TypedArray` APIs with a cached `TypedArray` fallback on older versions, and fix `isTypedArray()` returning `true` for `DataView`.
