---
'expo-crypto': patch
---

Fix `digest()` failing on Android and iOS when `data` is an `ArrayBuffer` or `DataView`. Both are valid `BufferSource` inputs and are now wrapped in a `Uint8Array` before reaching the native module.
